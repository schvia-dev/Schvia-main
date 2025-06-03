import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const ChatScreen = () => {
  const dummyChats = [
    {
      id: 1,
      name: 'John Doe',
      lastMessage: 'Hey, how are you?',
      time: '10:30 AM'
    },
    {
      id: 2,
      name: 'Jane Smith',
      lastMessage: 'Did you complete the assignment?',
      time: '9:45 AM'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      lastMessage: 'The class was great today!',
      time: 'Yesterday'
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chats</Text>
      <ScrollView style={styles.chatList}>
        {dummyChats.map(chat => (
          <View key={chat.id} style={styles.chatItem}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {chat.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.chatInfo}>
              <Text style={styles.name}>{chat.name}</Text>
              <Text style={styles.message}>{chat.lastMessage}</Text>
            </View>
            <Text style={styles.time}>{chat.time}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#fff',
  },
  chatList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#009F9D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#666',
  },
  time: {
    fontSize: 12,
    color: '#888',
  },
});

export default ChatScreen;