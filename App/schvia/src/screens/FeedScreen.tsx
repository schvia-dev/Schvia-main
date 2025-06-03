import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const FeedScreen = () => {
  const dummyPosts = [
    {
      id: 1,
      title: 'First Post',
      content: 'This is the content of the first post in our feed.',
      author: 'John Doe',
      time: '2 hours ago'
    },
    {
      id: 2,
      title: 'Learning React Native',
      content: 'React Native is an amazing framework for building mobile apps!',
      author: 'Jane Smith',
      time: '4 hours ago'
    },
    {
      id: 3,
      title: 'Mobile Development Tips',
      content: 'Here are some tips for better mobile app development...',
      author: 'Mike Johnson',
      time: '6 hours ago'
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Feed</Text>
      <ScrollView style={styles.feedContainer}>
        {dummyPosts.map(post => (
          <View key={post.id} style={styles.postCard}>
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postContent}>{post.content}</Text>
            <View style={styles.postFooter}>
              <Text style={styles.postAuthor}>{post.author}</Text>
              <Text style={styles.postTime}>{post.time}</Text>
            </View>
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
  feedContainer: {
    flex: 1,
    padding: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  postAuthor: {
    fontSize: 14,
    color: '#888',
  },
  postTime: {
    fontSize: 14,
    color: '#888',
  },
});

export default FeedScreen;