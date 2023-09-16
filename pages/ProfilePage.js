import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  Button,
  TextInput,
  FlatList,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library'; 
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import {
  handleSignUp,
  handleLogin,
  getUserProfile,
  fetchUserPosts,
  handleFollowing,
  handleUploadImage,
  handleSaveProfile,createChatRoom
} from '../firebase';
import firebase from 'firebase';
import SettingScreen from './SettingsPage';
import ChatScreen from './ChatPage';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { PostListSC } from '../App';
const SignupScreen = () => {
  const navigation = useNavigation();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        style={styles.editButton}
        onPress={handleSignUp({
          email: email,
          password: password,
          username: username,
        })}>
        <Text style={styles.editButtonText}>SIGN UP</Text>
      </TouchableOpacity>
    </View>
  );
};

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => handleLogin({ email, password })}>
        <Text style={styles.editButtonText}>LOG IN</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.editButtonText}>SIGN UP</Text>
      </TouchableOpacity>
    </View>
  );
};

const ProfileScreen = ({ userId }) => {
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState({});
  const [currentUser, setCurrentUser] = useState({});
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    fetchUserProfile();
  });

  const fetchUserProfile = async () => {
    const user = firebase.auth().currentUser;
    // console.log(user); 
    if(userId){
    const doc = await getUserProfile(userId);
    setUserProfile(doc);        
    } else {
    setCurrentUser(user);
    const doc = await getUserProfile(user.uid);
    setUserProfile(doc); 
    }

    // if (userProfile.location) {
    //   const placeName = await getPlaceName(userProfile.location.latitude, userProfile.location.longitude);
    //   setLocationName(placeName);
    // }
  };
  // const getPlaceName = async (latitude, longitude) => {
  //   try {
  //     const apiKey = 'AIzaSyDu0PFDdxpiHnFz6Z3YAMOaQL1BoD2qNy4'; // Replace with your Google Maps API Key
  //     const response = await fetch(
  //       `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
  //     );

  //     if (response.ok) {
  //       const data = await response.json();
  //       if (data.results && data.results.length > 0) {
  //         const placeName = data.results[0].formatted_address;
  //         setLocationName(placeName);
  //       } else {
  //         setLocationName('Location not found');
  //       }
  //     } else {
  //       setLocationName('Location not found');
  //     }
  //   } catch (error) {
  //     console.error('Error fetching place name:', error);
  //     setLocationName('Error');
  //   }
  // };

  if (!userProfile) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: userProfile.profilePicture }}
        style={styles.profileImage}
      />
      <Text style={styles.name}>
        {userProfile.firstName} {userProfile.lastName}
      </Text>
      <Text style={styles.username}>@{userProfile.username}</Text>
      <Text style={styles.info}>Email: {userProfile.email}</Text>
      <Text style={styles.info}>Gender: {userProfile.gender}</Text>
      <Text style={styles.info}>Bio: {userProfile.bio}</Text>
      
      {userId ? (
        <>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleFollowing(userId)}>
            <Text style={styles.editButtonText}>Follow</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={async () => {
              const chatroomId = await createChatRoom(currentUser.uid, userId);
              navigation.navigate('Chatting',{ chatroomId });
            }}>
            <Text style={styles.editButtonText}>Chat</Text>
          </TouchableOpacity>
        </>

      ) : (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const EditProfileScreen = ({ navigation }) => {
  const [userProfile, setUserProfile] = useState({
    profilePicture: null,
    firstName: '',
    lastName: '',
    bio: '',
    gender: '',
    location: { latitude: 0, longitude: 0 },
  });

  const [selectedLocation, setSelectedLocation] = useState({});
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState(null);
  
  useEffect(() => {
    const checkMediaLibraryPermission =async () => {
      const { status } = await MediaLibrary.getPermissionsAsync();
      setMediaLibraryPermission(status);
    };
    const fetchUserProfile = async () => {
      const user = firebase.auth().currentUser;
      if (user) {
        try {
          const doc = await getUserProfile(user.uid);
          // Check if the fetched document has all the expected fields
          if (doc && doc.profilePicture && doc.firstName && doc.lastName && doc.bio && doc.gender && doc.location) {
            setUserProfile(doc);
          } else {
            // Handle the case where some fields are missing or invalid
            console.log('User profile data missing:', doc);
          }
        } catch (error) {
          // Handle any errors that occurred during the fetch
          console.error('Error fetching user profile:', error);
        }
      }
    };
    // checkLocationPermission();
    checkMediaLibraryPermission();
    fetchUserProfile();
  });


  const checkLocationPermission =async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    console.log(location);
    setUserProfile({ ...userProfile, location: location.coords()});
  };



  const handleprofilePictureUpload =async () => {
    const profilePictureUrl = await handleUploadImage(userProfile.profilePicture);
    setUserProfile({ ...userProfile, profilePicture: profilePictureUrl });
  };

  const handleLocationSelect = (event) => {
    // Get the selected location from the event
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    // Update the location state
    setUserProfile({ ...userProfile, location: selectedLocation });
  };

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      alert('Permission to access media library required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.cancelled) {
      setUserProfile({ ...userProfile, profilePicture: result.uri });
      await handleprofilePictureUpload();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={handleImagePicker}>
        <Image
          source={
            userProfile.profilePicture
              ? { uri: userProfile.profilePicture }
              : require('../assets/profile-pic.png')
          }
          style={styles.profileImage}
        />
      </TouchableOpacity>
      <Text style={styles.subHeading}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="FirstName"
        value={userProfile.firstName}
        onChangeText={(text) =>
          setUserProfile({ ...userProfile, firstName: text })
        }
      />
      <TextInput
        style={styles.input}
        placeholder="LastName"
        value={userProfile.lastName}
        onChangeText={(text) =>
          setUserProfile({ ...userProfile, lastName: text })
        }
      />

      <Text style={styles.subHeading}>Bio</Text>
      <TextInput
        style={styles.input}
        placeholder="Bio"
        value={userProfile.bio}
        onChangeText={(text) => setUserProfile({ ...userProfile, bio: text })}
      />

      <Text style={styles.subHeading}>Gender</Text>
      <Picker
        selectedValue={userProfile.gender}
        style={styles.input}
        onValueChange={(itemValue) =>
          setUserProfile({ ...userProfile, gender: itemValue })
        }>
        <Picker.Item label="Male" value="Male" />
        <Picker.Item label="Female" value="Female" />
        <Picker.Item label="Other" value="Other" />
      </Picker>

      <TouchableOpacity
        style={styles.editButton}
        onPress={async () => 
        {await handleSaveProfile(userProfile);
        navigation.navigate('Profile');
        } }>
        <Text style={styles.editButtonText}>Save Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const FollowingsScreen = () => {
  const navigation = useNavigation();
  const [followings, setFollowings] = useState([]);

  useEffect(() => {
    const fetchFollowings = async () => {
      const user = firebase.auth().currentUser;

      if (user) {
        const doc = await firebase
          .firestore()
          .collection('users')
          .doc(user.uid)
          .get();
        setFollowings(doc.data().following || []);
      }
    };

    fetchFollowings();
  }, []);

  return (
    <View>
      <FlatList
        data={followings}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <>
            <Text>{item}</Text>
            <Button
              title="Chat"
              onPress={() => navigation.navigate('Chatting', { userId: item })}
            />
          </>
        )}
      />
    </View>
  );
};

const FollowersScreen = () => {
  const navigation = useNavigation();
  const [followers, setFollowers] = useState([]);

  useEffect(() => {
    const fetchFollowers = async () => {
      const user = firebase.auth().currentUser;

      if (user) {
        const doc = await firebase
          .firestore()
          .collection('users')
          .doc(user.uid)
          .get();
        setFollowers(doc.data().followers || []);
      }
    };

    fetchFollowers();
  }, []);

  return (
    <View>
      <FlatList
        data={followers}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <>
            <Text>{item}</Text>
            <Button
              title="Chat"
              onPress={() => navigation.navigate('Chatting', { userId: item })}
            />
          </>
        )}
      />
    </View>
  );
};

const UserActivityScreen = ({ navigation }) => {
  const [userPosts, setUserPosts] = useState([]);
  const [enrolledPosts, setEnrolledPosts] = useState([]);

  const [activeTab, setActiveTab] = useState('userPosts'); // Set the initial active tab
  const postsToDisplay = activeTab === 'userPosts' ? userPosts : enrolledPosts;

  useEffect(() => {
    // Fetch user posts
    fetchUserPosts('userId', '==')
      .then((data) => {
        setUserPosts(data);
      })
      .catch((error) => {
        console.error('Error fetching user posts:', error);
      });

    // Fetch enrolled posts
    fetchUserPosts('enrolled', 'array-contains')
      .then((data) => {
        setEnrolledPosts(data);
      })
      .catch((error) => {
        console.error('Error fetching enrolled posts:', error);
      });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => setActiveTab('userPosts')}>
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'userPosts' ? 'blue' : 'black' },
            ]}>
            User Posts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('enrolledPosts')}>
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'enrolledPosts' ? 'blue' : 'black' },
            ]}>
            Enrolled Posts
          </Text>
        </TouchableOpacity>
      </View>
      {/* Display the selected posts */}
      <View style={styles.postsContainer}>
        <PostListSC
          navigation={navigation}
          route={{ params: { posts: postsToDisplay } }}
        />
      </View>
    </View>
  );
};

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const navigation = useNavigation();
  useEffect(() => {
    const fetchUserData = async () => {
      const user = firebase.auth().currentUser;
      if (user) {
        const doc = await firebase.firestore().collection('users').doc(user.uid).get();
        if (doc.exists) {
          setUserData(doc.data());
        }
      }
    };

    fetchUserData();
  }, []);
  if (!userData) {
    return null; 
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <TouchableOpacity
        style={[styles.button, styles.doubleHeightButton]}
        onPress={() => navigation.navigate('Profile',{ userId: userData.id })}>
      <View style={styles.profileInfo}>
        <Image
          source={{ uri: userData.profilePicture }}
          style={styles.profileImage}
        />
        <View style={styles.profileText}>
          <Text style={styles.profileUsername}>{userData.firstName} {userData.lastName}</Text>
          <Text>{userData.gender}</Text>
        </View>
      </View>
      </TouchableOpacity>

      <View style={styles.followersFollowingsRow}>
        <TouchableOpacity
          style={styles.followersButton}
          onPress={() => navigation.navigate('Followers')}>
          <Text style={styles.buttonText}>
            Followers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.followingsButton}
          onPress={() => navigation.navigate('Followings')}>
          <Text style={styles.buttonText}>
            Following
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('UserActivity')}>
        <Text style={styles.buttonText}>User Activity</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.buttonText}> Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

const Stack = createStackNavigator();
const Profile = () => {
  return (
    <Stack.Navigator initialRouteName="ProfilePage">
      <Stack.Screen
        name="ProfilePage"
        component={ProfilePage}
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#9dd8fc', // set the background color of the header
          },
          headerTintColor: '#fff', // set the color of the header title and back button
          headerTitleStyle: {
            fontWeight: 'bold', // set the font weight of the header title
          },
          tabBarLabel: ' ',
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#9dd8fc', // set the background color of the header
          },
          headerTintColor: '#fff', // set the color of the header title and back button
          headerTitleStyle: {
            fontWeight: 'bold', // set the font weight of the header title
          },
          tabBarLabel: ' ',
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingScreen}
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#9dd8fc', // set the background color of the header
          },
          headerTintColor: '#fff', // set the color of the header title and back button
          headerTitleStyle: {
            fontWeight: 'bold', // set the font weight of the header title
          },
          tabBarLabel: ' ',
        }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#9dd8fc', // set the background color of the header
          },
          headerTintColor: '#fff', // set the color of the header title and back button
          headerTitleStyle: {
            fontWeight: 'bold', // set the font weight of the header title
          },
          tabBarLabel: ' ',
        }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#9dd8fc', // set the background color of the header
          },
          headerTintColor: '#fff', // set the color of the header title and back button
          headerTitleStyle: {
            fontWeight: 'bold', // set the font weight of the header title
          },
          tabBarLabel: ' ',
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#9dd8fc', // set the background color of the header
          },
          headerTintColor: '#fff', // set the color of the header title and back button
          headerTitleStyle: {
            fontWeight: 'bold', // set the font weight of the header title
          },
          tabBarLabel: ' ',
        }}
      />

      <Stack.Screen
        name="Followers"
        component={FollowersScreen}
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#9dd8fc', // set the background color of the header
          },
          headerTintColor: '#fff', // set the color of the header title and back button
          headerTitleStyle: {
            fontWeight: 'bold', // set the font weight of the header title
          },
          tabBarLabel: ' ',
        }}
      />
      <Stack.Screen
        name="Followings"
        component={FollowingsScreen}
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#9dd8fc', // set the background color of the header
          },
          headerTintColor: '#fff', // set the color of the header title and back button
          headerTitleStyle: {
            fontWeight: 'bold', // set the font weight of the header title
          },
          tabBarLabel: ' ',
        }}
      />
      <Stack.Screen
        name="UserActivity"
        component={UserActivityScreen}
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#9dd8fc', // set the background color of the header
          },
          headerTintColor: '#fff', // set the color of the header title and back button
          headerTitleStyle: {
            fontWeight: 'bold', // set the font weight of the header title
          },
          tabBarLabel: ' ',
        }}
      />
      <Stack.Screen
        name="Chatting"
        component={ChatScreen} 
        options={{ title: 'Chatting' }}
      />
    </Stack.Navigator>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  username: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 16,
  },
  info: {
    fontSize: 16,
    marginBottom: 8,
  },
  editButton: {
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    margin: 10,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  subHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: 'gray',
    marginBottom: 16,
    padding: 8,
    borderRadius: 4,
  },
  map: {
    flex: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  doubleHeightButton: {
    height: 150,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  profileText: {
    flex: 1,
  },
  profileUsername: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  followersFollowingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  followersButton: {
    flex: 1,
    height: 50,
    marginRight: 5,
    marginLeft: 5,
  },
  followingsButton: {
    flex: 1,
    height: 50,
    marginRight: 5,
    marginLeft: 5,
  },

  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  postsContainer: {
    flex: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    fontSize: 18,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 200,
  },
});
export { LoginScreen, SignupScreen, Profile, ProfileScreen};
