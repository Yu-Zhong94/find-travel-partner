import firebase from 'firebase';
import { View, Button, Alert } from 'react-native';
import * as Location from 'expo-location';

import { PermissionsAndroid, Platform } from 'react-native';
import geolib from 'geolib';
const firebaseConfig = {
  apiKey: ' ',
  authDomain: ' ',
  databaseURL: ' ',
  projectId: ' ',
  storageBucket: ' ',
  messagingSenderId: ' ',
  appId: ' ',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}




const sortedPostswithDistance = async (posts)=>
{
  const userLocation = await getUserLocation();
  // Calculate distance for each post
  const postsWithDistance = posts.map(post => {
    const postLocation = { latitude: post.location.latitude, longitude: post.location.longitude };
    const distance = geolib.getDistance(userLocation, postLocation);
    return { ...post, distance };
  });

  // Sort posts by distance
  const sortedPosts = postsWithDistance.sort((a, b) => {
    if (sortDistance === 'asc') {
      return a.distance - b.distance;
    } else {
      return b.distance - a.distance;
    }
  });
};

// upload image
const handleUploadImage = async (imageUri ) => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const fileName = `${Date.now()}_${imageUri}`;
    const storageRef = firebase.storage().ref();
    const imagesRef = storageRef.child('images');
    const fileRef = imagesRef.child(fileName);
    
    // Use put to upload the blob
    const snapshot = await fileRef.put(blob);
    // Get the download URL
    const downloadURL = await snapshot.ref.getDownloadURL();
    return downloadURL;
  } catch (error) {
    // handle error
    console.error('Error in uploading images', error);
    throw error;
  }
};

// user login, signup, signout

const handleSignUp = async ({ email, password, username }) => {
  try {
    if (email && password) {
      await firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          // Signed in
          const user = userCredential.user;

          // Save additional user info in Firestore
          firebase.firestore().collection('users').doc(user.uid).set({
            username: username,
            email: email,
          });

          console.log('User data saved successfully in Firestore!');
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          // Handle errors here
          console.error(errorCode, errorMessage);
        });
    } else {
      // Handle the case where email or password is missing
      console.error('Email and password are required');
    }
  } catch (error) {
    // Handle any errors that occur during sign-up
    console.error('Sign-up error:', error.message);
  }
};

const handleLogin = async ({ email, password }) => {
  try {
    if (email && password) {
      await firebase
        .auth()
        .signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          // Signed in
          const user = userCredential.user;
          console.log('User signed in:', user.uid);
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          // Handle errors here
          console.error(errorCode, errorMessage);
        });
    } else {
      // Handle the case where email or password is missing
      console.error('Email and password are required');
    }
  } catch (error) {
    // Handle any errors that occur during login
    console.error('Login error:', error.message);
  }
};

const handleSignout = () => {
  firebase
    .auth()
    .signOut()
    .then(() => {
      Alert.alert('Signed out!', 'You have been signed out successfully.');
    })
    .catch((error) => {
      Alert.alert('Error', error.message);
    });
};
const handleAccountCancellation = () => {
  Alert.alert(
    'Account Cancellation',
    'Are you sure you want to cancel your account?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Yes',
        onPress: () => {
          const user = firebase.auth().currentUser;

          // Delete user data from Firestore
          firebase
            .firestore()
            .collection('users')
            .doc(user.uid)
            .delete()
            .then(() => {
              // Delete user account from Firebase Authentication
              user
                .delete()
                .then(() =>
                  Alert.alert(
                    'Account Cancellation',
                    'Your account has been cancelled successfully.'
                  )
                )
                .catch((error) =>
                  Alert.alert(
                    'Error',
                    'Error cancelling account: ' + error.message
                  )
                );
            })
            .catch((error) =>
              Alert.alert('Error', 'Error deleting user data: ' + error.message)
            );
        },
      },
    ],
    { cancelable: false }
  );
};

// Handle password modification
const handlePasswordModification = (newPassword) => {
  const user = firebase.auth().currentUser;

  // re-authenticate the user
  const credential = firebase.auth.EmailAuthProvider.credential(
    user.email,
    user.password
  );

  user
    .reauthenticateWithCredential(credential)
    .then(() => {
      // update the user's password
      user
        .updatePassword(newPassword)
        .then(() => Alert.alert('Success', 'Password updated successfully.'))
        .catch((error) =>
          Alert.alert('Error', 'Error updating password: ' + error.message)
        );
    })
    .catch((error) =>
      Alert.alert('Error', 'Error re-authenticating: ' + error.message)
    );
};

// create, read, and update posts
const addPost = async (postdata) => {
  console.log(postdata); 
  try {
    const user = firebase.auth().currentUser;
    if (user) {
      const db = firebase.firestore();
      // Create a new chatroom
      const chatroomRef = await db.collection('chatrooms').add({
        users: [user.uid],
        name: postdata.title,
        created_at:firebase.firestore.FieldValue.serverTimestamp(),
        message:'',
        unread_count:0,
      });
      const postsRef = db.collection('posts');
      // Create a message
      const messagesRef = await db.collection('messages').add({
        chatroom: chatroomRef.id,
        sender: user.uid, // Add the current user to the chatroom
        content: 'welcome to your chatroom!',
        timestamp:firebase.firestore.FieldValue.serverTimestamp(),
      });

      postdata.postTime = new Date();
      postdata.enrolled = [user.uid]
      const docRef = await postsRef.add(postdata);
      await docRef.update({ userId: user.uid, chatRoomId: chatroomRef.id});
      console.log('add post success');

      return docRef.id;

    } else {
      console.log('unlogin');
    }
  } catch (error) {
    console.log('Error: ', error);
  }
};

const fetchAllPosts = async () => {
  try {
    const db = firebase.firestore();
    const postsRef = db.collection('posts');
    const snapshot = await postsRef.get();
    const allPosts = [];
    snapshot.forEach((doc) => {
      allPosts.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    console.log(allPosts);
    return allPosts;
  } catch (error) {
    console.log('Error: ', error);
  }
};

  const fetchFilteredPosts = async (userFilters, postFilters) => {
  try {
    // Step 1: Filter users
    const usersRef = firebase.firestore().collection('users');
    let userQuery = usersRef;

    if (userFilters.gender) {
      userQuery = userQuery.where('gender', '==', userFilters.gender);
    }

    if (userFilters.age) {
      userQuery = userQuery.where('age', '==', Number(userFilters.age));
    }

    const userSnapshot = await userQuery.get();
    const userIds = [];
    userSnapshot.forEach((doc) => {
      userIds.push(doc.id);
    });

    // Step 2: Filter posts
    const postsRef = firebase.firestore().collection('posts');
    let postQuery = postsRef.where('userId', 'in', userIds);

    if (postFilters.location) {
      postQuery = postQuery.where('location', '==', postFilters.location);
    }

    if (postFilters.fees) {
      postQuery = postQuery.where('fees', '<=', Number(postFilters.fees));
    }
    if (postFilters.sortFees) {
      postQuery = postQuery.orderBy('fees', postFilters.sortFees);
    }

    const postSnapshot = await postQuery.get();
    const filteredPosts = [];
    postSnapshot.forEach((doc) => {
      const post = doc.data();
      post.id = doc.id; 
      filteredPosts.push(post);
    });
    const posts = await sortedPostswithDistance(filteredPosts);
    return posts;
  } catch (error) {
    console.error('Error fetching filtered data:', error);
  }
};

const fetchUserPosts = async (querystring, querycheck) => {
  try {
    const user = firebase.auth().currentUser;
    if (user) {
      const db = firebase.firestore();
      const postsRef = db.collection('posts');
      const querySnapshot = await postsRef
        .where(querystring, querycheck, user.uid)
        .get();
      const userPosts = [];
      querySnapshot.forEach((doc) => {
        userPosts.push(doc.data());
      });
      return userPosts;
    } else {
      console.log('unlogin');
    }
  } catch (error) {
    console.log('Error:', error);
  }
};
const updateUserPost = async (postId, postdata) => {
  try {
    const user = firebase.auth().currentUser;
    if (user) {
      const db = firebase.firestore();
      const postRef = db.collection('posts').doc(postId);
      await postRef.update(postdata);
      console.log('update post success');
    } else {
      console.log('unlogin');
    }
  } catch (error) {
    console.log('Error: ', error);
  }
};
const enrollUserInPost = async (postId) => {
  try {
    const user = firebase.auth().currentUser;
    console.log(postId);
    if (user) {
      //enroll user in posts table
      const db = firebase.firestore();
      const postRef = db.collection('posts').doc(postId);
      
      await postRef.update({
        enrolled: firebase.firestore.FieldValue.arrayUnion(user.uid),
      });
      // enroll user in chatroom table
      const doc =  await firebase.firestore().collection('posts').doc(postId).get();
      const chatRoomId = doc.data().chatRoomId
      const chatroomRef = db.collection('chatrooms').doc(chatRoomId);
      await chatroomRef.update({
        users: firebase.firestore.FieldValue.arrayUnion(user.uid),
      });
    } else {
      console.log('unlogin');
    }
  } catch (error) {
    console.error('Error enrolling user:', error);
    throw error;
  } 
};

const getUserChatRoomIds = async () => {
  try {
    const user = firebase.auth().currentUser;
    const chatroomsRef = firebase
    .firestore()
    .collection('chatrooms');
  
    // Query chatrooms where 'users' field contains the user's ID
    const querySnapshot = await chatroomsRef.where('users', 'array-contains', user.uid).get();
    // Extract chatroom from the query results
    const chatRoom = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));  
    return chatRoom;
  } catch (error) {
    console.log('Error: ', error);
  }
};

// Listen to messages in all chat rooms associated with the user

const removeUserFromChatroom = async (chatroomId) => {
  try {
    const user = firebase.auth().currentUser;
    const chatroomRef = firebase
      .firestore()
      .collection('chatrooms')
      .doc(chatroomId);

    // Get the chatroom data
    const chatroomSnapshot = await chatroomRef.get();
    const chatroomData = chatroomSnapshot.data();

    if (!chatroomData) {
      throw new Error('Chatroom not found');
    }

    // Check if the user is a participant in the chatroom
    if (chatroomData.participants.includes(user.uid)) {
      // Remove the user from the participants array
      const updatedParticipants = chatroomData.participants.filter(
        (participantId) => participantId !== user.uid
      );

      // Update the chatroom with the new participants array
      await chatroomRef.update({ users: updatedParticipants });

      return true; // User successfully removed from the chatroom
    } else {
      throw new Error('User is not a participant in the chatroom');
    }
  } catch (error) {
    console.error('Error removing user from chatroom:', error);
    throw error;
  }
};

const sendMessage = async (chatRoomId, messageText) => {
  try {
    const user = firebase.auth().currentUser;
    const messagesRef = firebase
      .firestore()
      .collection('messages');
    await messagesRef.add({
        chatroom: chatRoomId,
        sender: user.uid, // Add the current user to the chatroom
        content: messageText,
        timestamp:firebase.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Message sent successfully!');
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Listen to new messages in a specific chat
const listenForMessages = (chatRoomId, callback) => {
  const db = firebase.firestore(); 
  const messagesRef = db
    .collection('messages')
    .where('chatroom', '==', chatRoomId)
    .orderBy('timestamp');

  // Listen for changes to the messages collection in the specified chatroom
  const unsubscribe = messagesRef
    .onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          // A new message has been added
          const newMessage = {
            id: change.doc.id,
            ...change.doc.data(),
          };
          callback(newMessage);
        }
      });
    }, (error) =>{
      console.error('Error listening for messages:', error);
    });
  return unsubscribe;
};

// Function to create a chat room between two users
const createChatRoom = async (user1Id, user2Id) => {
  try {
    const db = firebase.firestore();
    // Check if a chat room already exists between these two users
    const existingChatQuery = db
      .collection('chatrooms')
      .where('user', 'array-contains', user1Id)
      .where('user', 'array-contains', user2Id);

    const existingChatSnapshot = await existingChatQuery.get();

    if (!existingChatSnapshot.empty) {
      // If a chat room exists, return its ID
      const existingChat = existingChatSnapshot.docs[0];
      return existingChat.id;
    }

    // If no chat room exists, create a new chat room
    const chatRoomRef = db.collection('chatrooms').doc();
    await chatRoomRef.set({
      users: [user1Id, user2Id],
    });

    return chatRoomRef.id;
  } catch (error) {
    console.error('Error creating chat room:', error);
    throw error;
  }
};

// add user to existed chatrooms.
const addUsertoChatroom = async (userId, chatroomId) => {
  const chatroomRef = firebase.firestore().collection('chatrooms').doc(chatroomId);

  // Atomically add a new user to the "users" array field.
  await chatroomRef.update({
    users: firebase.firestore.FieldValue.arrayUnion(userId),
  });
};
// once user post a post, create a chatroom for the post, update post.chatRoomId.

//user profile
const getUserProfile = async (userId) => {
  try {
    const doc =  
    await 
    firebase.firestore().collection('users').doc(userId).get();

    if (doc) {
      return doc.data(); // Returns user data
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting document:", error);
  }
};
const handleSaveProfile = async (userProfile) => {
  try {
    const user = firebase.auth().currentUser;

    if (user) {
      await firebase.firestore().collection('users').doc(user.uid).update(userProfile);
      console.log("User profile successfully updated!");
    } else {
      console.log("No user is signed in.");
    }
  } catch (error) {
    console.error("Error updating user profile: ", error);
  }
};

const handleFollowing = async (userIdToFollow) => {
  try {
    const user = firebase.auth().currentUser;

    if (user) {
      const userDocRef = firebase.firestore().collection('users').doc(user.uid);
      await userDocRef.update({
        // update following region
        following: firebase.firestore.FieldValue.arrayUnion(userIdToFollow)
      });
      const user2DocRef = firebase.firestore().collection('users').doc(userIdToFollow);
      await user2DocRef.update({
        // update follower region
        follower: firebase.firestore.FieldValue.arrayUnion(user.uid)
      });

      console.log("User successfully followed!");
    } else {
      console.log("No user is signed in.");
    }
  } catch (error) {
    console.error("Error following user: ", error);
  }
};

export {
  handleSignUp,
  handleLogin,
  handleSignout,
  addPost,
  fetchAllPosts,
  fetchUserPosts,
  updateUserPost,
  enrollUserInPost,
  handleUploadImage,
  getUserChatRoomIds,
  removeUserFromChatroom,
  sendMessage,
  listenForMessages,
  createChatRoom,
  handleAccountCancellation,
  getUserProfile,
  handleFollowing,handleSaveProfile,fetchFilteredPosts,sortedPostswithDistance,addUsertoChatroom
};
