import {
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Image,
  TouchableOpacity,
  Button,
  TextInput,
} from 'react-native';

import { ButtonGroup, Slider } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Cell, Section, TableView } from 'react-native-tableview-simple'; 
import { Card } from 'react-native-paper';
import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import { ChatPage } from './pages/ChatPage';
import { LoginScreen, SignupScreen, Profile, ProfileScreen } from './pages/ProfilePage';

import { PostPage } from './pages/PostPage';
import firebase from 'firebase';
import {
  handleSignUp,
  handleLogin,
  handleSignout,
  fetchAllPosts,
  enrollUserInPost,
  fetchFilteredPosts,getUserProfile
} from './firebase';
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const PostDetailSmall = ({ post, action }) => {
  const tagArray = Object.values(post.tags);
  const [username,setUsername] = useState('');
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const fetchedPosts = await getUserProfile(post.userId);
        setUsername(fetchedPosts.username);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
    fetchUser();
  }, []);

  return (
    <TouchableOpacity style={styles.cellcontainer} onPress={action}>
      <View style={styles.postUserContainer}>
        <Text style={styles.etaText}>{username}</Text>
        <Text style={styles.etaText}>
          {' '}
          {new Date(post.postTime.seconds * 1000).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.postPicContainer}>
        <Image source={{ uri: post.image }} style={styles.image} />
      </View>
      <View style={styles.postInfoContainer}>
        <Text style={styles.tagline}>{post.title}</Text>
        <Text style={styles.tagline}>
          {new Date(post.startDate.seconds * 1000).toLocaleDateString()} --{' '}
          {new Date(post.endDate.seconds * 1000).toLocaleDateString()}
        </Text>
        <Text style={styles.tagline}>Participants: {post.participants}</Text>
      </View>
      {tagArray.length > 0 && (
        <View style={styles.etaContainer}>
          <Text>
            {tagArray.map((value, index) => (
              <Text key={index}># {value}</Text>
            ))}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
export const PostListSC = ({ navigation, route }) => {
  const { posts } = route.params;
  // Sort posts by posttime
  const sortedPosts = [...posts].sort((a, b) => new Date(b.postTime) - new Date(a.postTime));
  // console.log(sortedPosts);
  const navigateToPost = (post) => {
    navigation.navigate('PostDetailMore', { post });
  };
  return (
    <ScrollView>
      <TableView hideSeparator={true} separatorTintColor="#ccc">
        <Section>
          {sortedPosts.map((pd, index) => (
            <PostDetailSmall post={pd} action={() => navigateToPost(pd)} />
          ))}
        </Section>
      </TableView>
    </ScrollView>
  );
};

const PostList = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Filter')}>
          <Ionicons
            name="filter"
            size={24}
            color="white"
            style={{ marginRight: 15 }}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const fetchedPosts = await fetchAllPosts();
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    fetchPosts();
  }, []);

  return (
    <View style={styles.container}>
      <PostListSC
        navigation={navigation}
        route={{ params: { posts: posts } }}
      />
      <View style={styles.floatingButton}>
        <TouchableOpacity onPress={() => navigation.navigate('Post')}>
          <Icon name="plus-circle" size={80} color="rgba(0, 0, 0, 0.5)" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const FilterScreen = ({ navigation }) => {
  const [genderFilter, setGenderFilter] = useState('0');
  const [ageFilter, setAgeFilter] = useState(20);
  const [feesFilter, setFeesFilter] = useState(5000);
  const genderButtons = ['Male', 'Female', 'Other'];
  const feesButtons = ['Low to High', 'High to Low'];
  const [selectedFeesIndex, setSelectedFeesIndex] = useState(0);
  const distanceButtons = ['Near to Far', 'Far to Near'];
  const [selectedDistanceIndex, setSelectedDistanceIndex] = useState(0);

  const resetFilters = () => {
    console.log('Button pressed!');
    setGenderFilter(0);
    setAge(20);
    setDistance(10);
    // Reset any other filters you have
  };

  const applyFilters = () => {
    const userFilters = {
      gender: genderFilter,
      age: ageFilter,
    };
    const postFilters = {
      fees: feesFilter,
      sortFees,
      sortDistance,
    };
    const filteredData = fetchFilteredPosts(userFilters, postFilters);

    // Navigate to the list screen with the filtered data
    navigation.navigate('PostList', { filteredData });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Post Filter</Text>
      </View>
      <Text>Gender Selection</Text>
      <ButtonGroup
        onPress={setGenderFilter}
        selectedIndex={genderFilter}
        buttons={genderButtons}
      />

      <Text>Age: {ageFilter}</Text>
      <Slider
        value={ageFilter}
        onValueChange={setAgeFilter}
        minimumValue={18}
        maximumValue={100}
        step={1}
      />

      <Text>Fees($): {feesFilter}</Text>
      <Slider
        value={feesFilter}
        onValueChange={setFeesFilter}
        minimumValue={1}
        maximumValue={10000}
        step={1}
      />

      <ButtonGroup
        onPress={(selectedIndex) => {
          setSelectedFeesIndex(selectedIndex);
          setSortFees(selectedIndex === 0 ? 'asc' : 'desc');
        }}
        selectedIndex={selectedFeesIndex}
        buttons={feesButtons}
      />
      <ButtonGroup
        onPress={(selectedIndex) => {
          setSelectedDistanceIndex(selectedIndex);
          setSortDistance(selectedIndex === 0 ? 'asc' : 'desc');
        }}
        selectedIndex={selectedDistanceIndex}
        buttons={distanceButtons}
      />
      <View style={styles.footer}>
        <TouchableOpacity onPress={resetFilters} style={styles.footerButton}>
          <Text>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={applyFilters} style={styles.footerButton}>
          <Text>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const PostDetailMore = ({ route, navigation }) => {
  const { post } = route.params;
  const [placeName, setPlaceName] = useState(null);
  const [userData, setUserData] = useState(null);
  const defaultProfilePicture = require('./assets/blank-pic.jpg'); 
  const enrolledArray = Object.values(post.enrolled);
  const tagArray = Object.values(post.tags);
  const [enrolledUsers, setEnrolledUsers] = useState([]);

  useEffect(() => {
    const getPlaceName = async (latitude, longitude) => {
      try {
        const apiKey = 'AIzaSyDu0PFDdxpiHnFz6Z3YAMOaQL1BoD2qNy4'; // Replace with your Google Maps API Key
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const placeName = data.results[0].formatted_address;
            setPlaceName(placeName);
          } else {
            setPlaceName('Location not found');
          }
        } else {
          setPlaceName('Location not found');
        }
      } catch (error) {
        console.error('Error fetching place name:', error);
        setPlaceName('Error');
      }
    };
    if (post.location){
      getPlaceName(post.location.latitude, post.location.longitude);
    }
    
  }, [post]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const fetchedPosts = await getUserProfile(post.userId);
        setUserData(fetchedPosts.username);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
    fetchUser();
  }, [post.userId]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (enrolledArray.length > 0) {
        const fetchedUsers = await Promise.all(
          enrolledArray.map(async (value) => {
            const user = await getUserProfile(value);
            return user.username;
          })
        );
        setEnrolledUsers(fetchedUsers);
      }
    };
    fetchUsers();
  }, [enrolledArray]);

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: post.image }} style={styles.image} />
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.description}>{post.description}</Text>
      {userData && userData.profilePicture && (
      <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: post.userId })}>
        <Image source={{ uri: userData && userData.profilePicture ? userData.profilePicture : defaultProfilePicture }} style={styles.profilePicture} />
      </TouchableOpacity>
    )}
      <Text style={styles.date}>
        From: {new Date(post.startDate.seconds * 1000).toLocaleDateString()} To:{' '}
        {new Date(post.endDate.seconds * 1000).toLocaleDateString()}
      </Text>

      <Text style={styles.participants}>Team: {post.participants} people</Text>
      {enrolledArray.length > 0 && (
        <View style={styles.participants}>
          <Text style={styles.participants}>Enrolled: </Text>
          {enrolledUsers.map((value, index) => (
            <Text key={index}>{value}</Text>
          ))}
        </View>
      )}
      {tagArray.length > 0 && (
        <View style={styles.tags}>
          <Text style={styles.tagline}>
            {tagArray.map((value, index) => (
              <Text key={index}>#{value}</Text>
            ))}
          </Text>
        </View>
      )}
      {placeName && (
        <View style={styles.locationContainer}>
          <Text style={styles.location}>Location: {placeName}</Text>
        </View>
      )}
      <Button title="Enroll" onPress={async()=> {
        console.log("post.id:", post.id); 
        await enrollUserInPost(post.id);} } />
    </ScrollView>
  );
};

const navBottom = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
      tabBarOptions={{
        activeTintColor: '#9dd8fc',
        inactiveTintColor: 'gray',
        labelStyle: {
          fontSize: 14,
        },
        style: {
          backgroundColor: '#f5f5f5',
        },
      }}>
      <Tab.Screen
        name="Home"
        component={PostList}
        options={({ navigation }) => ({
          headerShown: true,
          title: 'Find Partner', // set the header title
          headerStyle: {
            backgroundColor: '#9dd8fc', // set the background color of the header
          },
          headerTintColor: '#fff', // set the color of the header title and back button
          headerTitleStyle: {
            fontWeight: 'bold', // set the font weight of the header title
          },
          tabBarLabel: ' ',
        })}
      />
      <Tab.Screen
        name="Chat"
        component={ChatPage}
        options={{
          headerShown: false,
          title: 'Chat', // set the header title
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
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          headerShown: false,
          title: '', // set the header title
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
    </Tab.Navigator>
  );
};
export const HomeScreen = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="navBottom"
        component={navBottom}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Filter"
        component={FilterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Post"
        component={PostPage}
        options={{ headerShown: true,
          title: '', // set the header title
          headerStyle: {
            backgroundColor: '#9dd8fc', // set the background color of the header
          },
          headerTintColor: '#fff', // set the color of the header title and back button
          headerTitleStyle: {
            fontWeight: 'bold', // set the font weight of the header title
          },
        }}
      />
      <Stack.Screen
        name="PostDetailMore"
        component={PostDetailMore}
        options={{
          headerShown: true,
          title: '', // set the header title
          headerStyle: {
            backgroundColor: '#9dd8fc', // set the background color of the header
          },
          headerTintColor: '#fff', // set the color of the header title and back button
          headerTitleStyle: {
            fontWeight: 'bold', // set the font weight of the header title
          },
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
const App = () => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      // user = 'test';
      if (user) {
        // User is signed in
        console.log('User logged in: ', user);
        setUser(user);
      } else {
        // User is signed out
        console.log('User logged out');
        setUser(null);
      }
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  cellcontainer: {
    flex: 1,
    flexDirection: 'column',
    margin: 10,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 10,
  },
  postUserContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  etaText: {
    fontSize: 14,
    color: '#000',
  },
  postPicContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 200,
  },
  postInfoContainer: {
    marginTop: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#000',
  },
  etaContainer: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  description: {
    fontSize: 16,
    marginBottom: 10,
  },
  date: {
    fontSize: 16,
    marginBottom: 10,
  },
  participants: {
    fontSize: 16,
    marginBottom: 10,
  },
  location: {
    fontSize: 16,
    marginBottom: 10,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  container: {
    flex: 1,
  },
  floatingButton: {
    position: 'absolute',
    right: 30,
    bottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  footerButton: {
    padding: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
  },
});
export default App;
