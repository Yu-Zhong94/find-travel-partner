import {
  View,
  ScrollView,
  Text,
  Platform,
  Alert,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
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
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

const ModifyPasswordScreen = () => {
  const [newPassword, setNewPassword] = useState('');

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handlePasswordModification}>
        <Text style={styles.buttonText}>Modify Password</Text>
      </TouchableOpacity>
    </View>
  );
};

const UserAgreementScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.text}>
        Welcome to Our App! This User Agreement ("Agreement") is a legal
        agreement between you and Our App, Inc. Please read this Agreement
        carefully before using our app.
      </Text>
      <Text style={styles.text}>
        By using our app, you agree to comply with and be bound by this
        Agreement. If you do not agree with these terms, please do not use our
        app.
      </Text>
      <Text style={styles.sectionTitle}>1. Account Registration</Text>
      <Text style={styles.text}>
        To use certain features of our app, you may be required to register for
        an account. You agree to provide accurate and complete information
        during the registration process.
      </Text>
      <Text style={styles.sectionTitle}>2. User Content</Text>
      <Text style={styles.text}>
        You are solely responsible for any content you submit or post in our
        app. By using our app, you grant us a worldwide, non-exclusive,
        royalty-free, and transferable license to use, reproduce, modify, adapt,
        distribute, and display your content.
      </Text>
      <Text style={styles.sectionTitle}>3. Privacy</Text>
      <Text style={styles.text}>
        Your use of our app is also governed by our Privacy Policy. Please
        review our Privacy Policy to understand how we collect, use, and protect
        your personal information.
      </Text>
      <Text style={styles.sectionTitle}>4. Termination</Text>
      <Text style={styles.text}>
        We reserve the right to terminate or suspend your account at any time
        for violations of this Agreement or for any other reason.
      </Text>
    </ScrollView>
  );
};

const PrivacyPolicyScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.text}>
        Your privacy is important to us. This Privacy Policy explains how we
        collect, use, and protect your personal information when you use our
        app.
      </Text>
      <Text style={styles.text}>
        By using our app, you agree to the terms of this Privacy Policy. If you
        do not agree with these terms, please do not use our app.
      </Text>
      <Text style={styles.sectionTitle}>1. Information We Collect</Text>
      <Text style={styles.text}>
        We may collect information you provide directly, such as your name,
        email address, and profile picture.
      </Text>
      <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
      <Text style={styles.text}>
        We may use your information to provide and personalize our services,
        communicate with you, and improve our app.
      </Text>
      <Text style={styles.sectionTitle}>3. Information Sharing</Text>
      <Text style={styles.text}>
        We do not share your personal information with third parties unless
        required by law or for app-related purposes.
      </Text>
      <Text style={styles.sectionTitle}>4. Security</Text>
      <Text style={styles.text}>
        We take reasonable measures to protect your personal information, but no
        method of transmission over the internet is 100% secure.
      </Text>
    </ScrollView>
  );
};

const AboutAppScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.text}>
        Welcome to our app! We're excited to have you as a user. This app was
        created with the goal of providing you with a seamless and enjoyable
        experience.
      </Text>
      <Text style={styles.text}>
        Our mission is to make your life easier and more convenient by offering
        a range of features and services that cater to your needs.
      </Text>
      <Text style={styles.text}>
        We are continuously working to improve our app and enhance your user
        experience. Your feedback is valuable to us, and we appreciate your
        support.
      </Text>
      <Text style={styles.sectionTitle}>Contact Us</Text>
      <Text style={styles.text}>
        If you have any questions, suggestions, or concerns, please don't
        hesitate to contact us at m13545022224@163.com
      </Text>
    </ScrollView>
  );
};

const SettingsScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Modify Password')}>
        <Text style={styles.buttonText}>Modify Password</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('User Agreement')}>
        <Text style={styles.buttonText}>User Agreement</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Privacy Policy')}>
        <Text style={styles.buttonText}>Privacy Policy</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('About App')}>
        <Text style={styles.buttonText}>About App</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={handleAccountCancellation}>
        <Text style={styles.buttonText}>Account Cancellation</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleSignout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const Stack = createStackNavigator();
const App = () => {
  return (
    <Stack.Navigator initialRouteName="Settings">
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Modify Password"
        component={ModifyPasswordScreen}
        options={{
          headerShown: true,
          headerLeft: null, // Hide the back button
          headerTitleAlign: 'center', // Center the header title
          headerStyle: {
            backgroundColor: '#fff', // set the background color of the header
          },
          headerTintColor: '#000', // set the color of the header title and back button
          headerTitleStyle: {
            fontWeight: 'bold', // set the font weight of the header title
          },
          tabBarLabel: ' ',
        }}
      />
      <Stack.Screen
        name="User Agreement"
        component={UserAgreementScreen}
        options={{
          headerShown: true,
          headerLeft: null, // Hide the back button
          headerTitleAlign: 'center', // Center the header title
          headerStyle: {
            backgroundColor: '#fff', // set the background color of the header
          },
          headerTintColor: '#000', // set the color of the header title and back button
          headerTitleStyle: {
            fontWeight: 'bold', // set the font weight of the header title
          },
          tabBarLabel: ' ',
        }}
      />
      <Stack.Screen
        name="Privacy Policy"
        component={PrivacyPolicyScreen}
        options={{
          headerShown: true,
          headerLeft: null, // Hide the back button
          headerTitleAlign: 'center', // Center the header title
          headerStyle: {
            backgroundColor: '#fff', // set the background color of the header
          },
          headerTintColor: '#000', // set the color of the header title and back button
          headerTitleStyle: {
            fontWeight: 'bold', // set the font weight of the header title
          },
          tabBarLabel: ' ',
        }}
      />
      <Stack.Screen
        name="About App"
        component={AboutAppScreen}
        options={{
          headerShown: true,
          headerLeft: null, // Hide the back button
          headerTitleAlign: 'center', // Center the header title
          headerStyle: {
            backgroundColor: '#fff', // set the background color of the header
          },
          headerTintColor: '#000', // set the color of the header title and back button
          headerTitleStyle: {
            fontWeight: 'bold', // set the font weight of the header title
          },
          tabBarLabel: ' ',
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  button: {
    backgroundColor: '#eee',
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
    borderBottomWidth: 1, // Add a bottom border
    borderBottomColor: 'gray',
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
export default App;
