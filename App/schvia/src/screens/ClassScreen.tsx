import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { RFValue } from 'react-native-responsive-fontsize';
import { getStoredStudentDetails } from '../components/getStoredStudentDetails';
import { ngrokConfig } from '../ngrokconfig';
import { ErrorAlert } from '../components/Alerts';

interface Subject {
  subject_id: string;
  code: string;
  name: string;
  faculty: string;
}

const ClassScreen = () => {
  const { colors } = useTheme();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const scaleAnim = new Animated.Value(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch student details
        const details = await getStoredStudentDetails();
        if (!details || !details.student_id) {
          throw new Error('Student details not found');
        }
        setStudentDetails(details);

        // Fetch subjects from backend
        const response = await fetch(`${ngrokConfig.ngrok_URL}/app/subjects/${details.student_id}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });

        const text = await response.text();
        const data = JSON.parse(text);

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch subjects');
        }

        setSubjects(data.data);
      } catch (error: any) {
        console.error('Error fetching subjects:', error);
        setErrorMessage(error.message || 'An error occurred while fetching subjects');
        setShowErrorAlert(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const HandleClassPressButtom = (id: string, name: string) => {
    console.log(`Pressed Subject ID: ${id}`);
    console.log(`Pressed Subject Name: ${name}`);
    // Add navigation or additional logic here
  };

  const getColor = (id: string) => {
    const colorKeys = Object.keys(colors.classcolors).map(Number);
    const index = parseInt(id, 10) % colorKeys.length;
    const selectedKey = colorKeys[index];
    return colors.classcolors[selectedKey as keyof typeof colors.classcolors];
  };

  const renderItem = ({ item }: { item: Subject }) => (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => HandleClassPressButtom(item.subject_id, item.name)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.white,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          ...colors.card.shadow,
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: getColor(item.subject_id) }]}>
        <Text style={styles.iconText}>{item.code}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.subjectTitle, { color: colors.text.primary }]}>{item.name}</Text>
        <Text style={[styles.faculty, { color: colors.text.secondary }]}>{item.faculty}</Text>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.primary }]}>Loading subjects...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.primary }]}>Class Subjects</Text>
        </View>

        <Text style={[styles.semesterHeading, { color: colors.primary }]}>
          {studentDetails ? `${studentDetails.semester_abbreviation} Semester ` : 'THIS SEMESTER'}
        </Text>

        {subjects.length === 0 ? (
          <Text style={[styles.noDataText, { color: colors.text.secondary }]}>
            No subjects found for this semester.
          </Text>
        ) : (
          <FlatList
            data={subjects}
            keyExtractor={(item) => item.subject_id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      <ErrorAlert
        visible={showErrorAlert}
        heading="Error"
        description={errorMessage}
        onClose={() => setShowErrorAlert(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: Math.min(RFValue(22), 22),
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  semesterHeading: {
    fontSize: Math.min(RFValue(16), 16),
    fontWeight: '600',
    marginBottom: 10,
  },
  list: {
    paddingBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontWeight: 'bold',
    color: '#333',
  },
  textContainer: {
    flex: 1,
  },
  subjectTitle: {
    fontSize: Math.min(RFValue(16), 16),
    fontWeight: '600',
  },
  faculty: {
    fontSize: Math.min(RFValue(13), 13),
    marginTop: 2,
  },
  loadingText: {
    fontSize: Math.min(RFValue(16), 16),
    marginTop: 10,
  },
  noDataText: {
    fontSize: Math.min(RFValue(16), 16),
    textAlign: 'center',
    marginTop: 20,
  },
});

export default ClassScreen;