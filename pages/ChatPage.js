import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  Button,
  TouchableOpacity, Platform, KeyboardAvoidingView
} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { GiftedChat } from 'react-native-gifted-chat';
const Stack = createStackNavigator();
import {getUserChatRoomIds,listenForMessagesInAllChats,removeUserFromChatroom,sendMessage,listenForMessages,createChatRoom } from '../firebase';
import { useNavigation } from '@react-navigation/native';


const handleCreateChat = async (otherUserId) => {
  try {
    const chatRoomId = await createChatRoom(firebase.auth().currentUser.uid, otherUserId);
    navigation.navigate('Chat', { chatRoomId });
  } catch (error) {
    console.error('Error creating chat:', error);
  }
};
// Chat Messages Screen
const ChannelsScreen = () => {
  const [chatRooms, setChatRooms] = useState({});
  const [newMessages, setNewMessages] = useState({}); 
  const [unsubscribeFunctions, setUnsubscribeFunctions] = useState([]);
  const navigation = useNavigation();
useEffect(() => {
  const fetchChatRooms = async () => {
    const chatRooms = await getUserChatRoomIds();
    setChatRooms(chatRooms);
    for (const chatRoom of chatRooms) {
      listenForMessages(chatRoom.id, (newMessage) => {
        setNewMessages((prevMessages) => ({
          ...prevMessages,
          [chatRoom.id]: newMessage,
        }));
      }).catch((error) => {
        console.error('监听聊天室消息时出错:', error);
      });
    }
  };

  fetchChatRooms();
}, []);


  const handleChannelPress = (chatRoomId, recipientUserId) => {
    navigation.navigate('Chatting', { chatRoomId });
  };
  return (
    <View style={styles.container}>
      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatRoomItem}
            onPress={() => handleChannelPress(item.id)}
          >
            <Text style={styles.chatRoomText}>{item.name}</Text>
            {newMessages[item.id] && (
              <Text style={styles.newMessageText}>{newMessages[item.id].content}</Text>)}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};


// Chatting Screen
const ChatScreen = ({ route }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { chatRoomId } = route.params; // Get chatRoomId from navigation

  useEffect(() => {
    // Use the listenForMessages function to listen for new messages in the chat room
    const unsubscribe = listenForMessages(chatRoomId, (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    return () => {
      // Clean up the listener when the component unmounts
      unsubscribe();
    };
  }, [chatRoomId]);

  const handleSend = async () => {
    if (newMessage.trim() === '') {
      return;
    }

    try {
      // Use the sendMessage function to send a message to the chat room
      await sendMessage(chatRoomId, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <View style={styles.list}>

      <FlatList
        data={messages}
        keyExtractor={(message) => message.id}
        renderItem={({ item }) => (
          <>
            <View style={styles.item}>
              <Text style={styles.name}>{item.sender}</Text>
            </View>
            <View style={styles.item}>
              <Text style={styles.message}>{item.content}</Text>
            </View>
          </>
        )} 
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message..."
        />
        <Button title="Send" onPress={handleSend} style={styles.sendButton} />
      </View>
    </View>
  );
};

// ChatPage
const ChatPage = () => {
  return (
    <Stack.Navigator
      initialRouteName="ChatMessages"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#9dd8fc',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen
        name="ChatMessages"
        component={ChannelsScreen}
        options={{ title: 'Chat Messages' }}
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
  list: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  item: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 14,
    color: '#888',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#ddd',
  },
  sendButton: {
    marginLeft: 10,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  chatRoomItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
    borderRadius: 8,
  },
  chatRoomText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
export { ChatPage, ChatScreen};
