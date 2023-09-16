import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { ButtonGroup, Slider } from 'react-native-elements';
import DatePicker from 'react-native-datepicker';
// import ImagePicker from 'react-native-image-picker';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import {
  handleSignUp,
  handleLogin,
  handleSignout,
  addPost,
  fetchAllPosts,
  fetchUserPosts,
  updateUserPost,
  enrollUserInPost,
  handleUploadImage,
  handleAccountCancellation,
  handlePasswordModification,
} from '../firebase';
import { useNavigation } from '@react-navigation/native';
import { HomeScreen } from '../App';
import { createStackNavigator } from '@react-navigation/stack';



const PostScreen = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const currentDate = new Date();
  const threeDaysFromNow = new Date(currentDate);
  threeDaysFromNow.setDate(currentDate.getDate() + 3);
  const [startDate, setStartDate] = useState(currentDate);
  const [endDate, setEndDate] = useState(threeDaysFromNow);
  const [location, setLocation] = useState(null);
  const [fees, setFees] = useState('');
  const [participants, setParticipants] = useState(0);
  const [image, setImage] = useState(null);
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const navigation = useNavigation();
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // let location = await Location.getCurrentPositionAsync({});
      let location = {latitude:12,longitude:12}; 
      setLocation(location);
    })();
  }, []);
  useEffect(() => {
    async function checkMediaLibraryPermission() {
      const { status } = await MediaLibrary.getPermissionsAsync();
      setMediaLibraryPermission(status);
    }

    checkMediaLibraryPermission();
  }, []);
  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      alert('Permission to access media library required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1.5, 1],
      quality: 1,
    });

    if (!result.cancelled && result.uri) {
      let imageUri = result.uri;

      // If the platform is iOS
      if (Platform.OS === 'ios') {
        imageUri = imageUri.replace('file://', '');
      }

      setImage(imageUri);
    }
  };
  const handleLocationChange = (event) => {
    const location = {
      latitude: event.nativeEvent.coordinate.latitude,
      longitude: event.nativeEvent.coordinate.longitude,
    };
    setSelectedLocation(location);
    setLocation(location);
  };
  const validateForm = () => {
    if (
      !title ||
      !description ||
      !startDate ||
      !endDate ||
      !location ||
      !fees ||
      participants <= 0
    ) {
      return false;
    }
    return true;
  };
  const handlePost = async () => {
    try {
      // Upload the image and get the download URL
      const imageUrl = await handleUploadImage(image);

      const postData = {
        title: title,
        description: description,
        startDate: startDate,
        endDate: endDate,
        location: location,
        fees: fees,
        participants: participants,
        image: imageUrl,
        tags: tags.split(','),
      };
      console.log(postData);
      const postId = await addPost(postData);
      console.log(`Post created with ID: ${postId}`);
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      <Text style={styles.title}>Description</Text>
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <View style={styles.mapContainer}>
        <Text style={styles.title}>Location</Text>
        {location && (
          <MapView
            style={styles.map}
            region={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            onPress={handleLocationChange}>
            <Marker coordinate={location} />
          </MapView>
        )}
        {errorMsg && <Text>Error: {errorMsg}</Text>}
      </View>

      <View style={styles.datePickerContainer}>
        <Text style={styles.title}>From:</Text>
        <DatePicker
          style={styles.datePicker}
          date={startDate}
          mode="date"
          placeholder="Select date"
          format="YYYY-MM-DD"
          minDate={currentDate.toISOString().split('T')[0]}
          maxDate="2030-12-31"
          confirmBtnText="Confirm"
          cancelBtnText="Cancel"
          customStyles={{
            dateIcon: {
              display: 'none',
            },
            dateInput: {
              borderWidth: 0,
              borderBottomWidth: 1,
              alignItems: 'center',
            },
          }}
          onDateChange={setStartDate}
        />
        <Text style={styles.title}>To:</Text>
        <DatePicker
          style={styles.datePicker}
          date={endDate}
          mode="date"
          placeholder="Select date"
          format="YYYY-MM-DD"
          minDate={currentDate.toISOString().split('T')[0]}
          maxDate="2030-12-31"
          confirmBtnText="Confirm"
          cancelBtnText="Cancel"
          customStyles={{
            dateIcon: {
              display: 'none',
            },
            dateInput: {
              borderWidth: 0,
              borderBottomWidth: 1,
              alignItems: 'center',
            },
          }}
          onDateChange={setEndDate}
        />
      </View>

      <View style={styles.sliderContainer}>
        <Text style={styles.title}>Fees</Text>
        <Slider
          style={styles.slider}
          thumbTintColor="#007BFF"
          thumbTouchSize={{ width: 5, height: 5 }}
          onValueChange={setFees}
          minimumValue={0}
          maximumValue={50000}
          step={1}
        />
        <Text style={styles.sliderValue}>{fees}</Text>
      </View>
      <View style={styles.sliderContainer}>
        <Text style={styles.title}>Participants</Text>
        <Slider
          style={styles.slider}
          thumbTintColor="#007BFF"
          thumbTouchSize={{ width: 5, height: 5 }}
          value={participants}
          onValueChange={setParticipants}
          minimumValue={0}
          maximumValue={100}
          step={1}
        />
        <Text style={styles.sliderValue}>{participants}</Text>
      </View>

      <TouchableOpacity onPress={handleImagePicker}>
        <Image
          source={image ? { uri: image } : require('../assets/blank-pic.jpg')}
          style={styles.image}
        />
      </TouchableOpacity>
      <Text style={styles.title}>Tags</Text>
      <TextInput
        style={styles.input}
        placeholder="Tags (comma separated)"
        value={tags}
        onChangeText={setTags}
      />

      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handlePost}>
          <Text style={styles.buttonText}>Post travel plan</Text>
        </TouchableOpacity>
      )}
      <View />
    </ScrollView>
  );
};
const Stack = createStackNavigator();
const PostPage = () => {
  return (
    <Stack.Navigator initialRouteName="Post">
      <Stack.Screen
        name="Post"
        component={PostScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 50,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  mapContainer: {
    marginBottom: 20,
  },
  map: {
    height: 200,
    marginBottom: 10,
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  datePicker: {
    width: '45%',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  slider: {
    flex: 1,
    marginRight: 10,
  },
  sliderValue: {
    width: 50,
    textAlign: 'right',
    color: '#888',
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 20,
    marginButton: 50,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export { PostPage };
