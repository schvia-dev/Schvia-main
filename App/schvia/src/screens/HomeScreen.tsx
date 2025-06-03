import React,{ useEffect, useState }  from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useTheme } from '../theme/ThemeContext';
import { RFValue } from "react-native-responsive-fontsize";
import { getStoredStudentDetails } from '../components/getStoredStudentDetails';
import { fetchAndStoreStudentDetails } from '../components/fetchStudentDetails';

interface FeatureIconProps {
  name: any;
  label: string;
}

interface PersonCardProps {
  name: string;
  title: string;
  rating: string;
}

const FeatureIcon: React.FC<FeatureIconProps> = ({ name, label }) => {
  const { colors } = useTheme();
  const styles = getstyles(colors); // Pass colors to style
  return (
    <View style={[styles.featureBox, { backgroundColor: colors.white }]}>
      <FontAwesome5 name={name} size={20} color={colors.primary} />
      <Text style={[styles.featureLabel, { color: colors.text.primary }]}>{label}</Text>
    </View>
  );
};

const PersonCard: React.FC<PersonCardProps> = ({ name, title, rating }) => {
  const { colors } = useTheme();const styles = getstyles(colors); // Pass colors to style
  return (
    <View style={[styles.personCard, { backgroundColor: colors.white }]}>
      <Image
        source={require('../assets/avatar.png')}
        style={styles.avatar}
      />
      <View>
        <Text style={[styles.personName, { color: colors.text.primary }]}>{name}</Text>
        <Text style={[styles.personTitle, { color: colors.text.secondary }]}>{title}</Text>
        <Text style={[styles.rating, { color: colors.primary }]}>⭐ {rating}</Text>
      </View>
    </View>
  );
};

const HomeScreen: React.FC = () => {
  const [userdata, setUserdata] = useState<any | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      const data = await getStoredStudentDetails();
      setUserdata(data);
    };

    fetchData();
  }, []);
  
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();
  const styles = getstyles(colors); // Pass colors to style
  const handleReload = () => {
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      rotateAnim.setValue(0);
      
      const fetchData = async () => {
        await fetchAndStoreStudentDetails(userdata.student_id);
        const data = await getStoredStudentDetails();
        setUserdata(data);
      };
      
      fetchData();

    });
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  console.log("userdata in home page",userdata);
  if (!userdata) {
    return null;
  }
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Greeting & Notification */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.primary }]}>Hello,{"\n"}{userdata.student_name}</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Attendance Card */}
      <View style={[styles.card, { backgroundColor: colors.primary }]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.cardTitle,{ color: colors.cardinfo.cardtextcolor}]}>{userdata.student_attendence_percentage}%</Text>
            <Text style={[styles.cardSubtitle, { color: colors.cardinfo.cardtextcolor}]}>Attendance this Semester</Text>
            <Text style={[styles.cardTrend,{color: colors.cardinfo.cardtextcolor}]}>⚙ {userdata.student_attendence_percentage_today}% – Today's Attendance</Text>
          </View>
          <TouchableOpacity onPress={handleReload} style={styles.reloadButton}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="refresh" size={24} color={colors.cardinfo.reload} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modules */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Modules</Text>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
        </View>
        <View style={styles.iconRow}>
          <FeatureIcon name="user-tie" label="HR" />
          <FeatureIcon name="file-invoice-dollar" label="Finance" />
          <FeatureIcon name="tasks" label="Tasks" />
        </View>
      </View>

      {/* Top Employees */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Top Employees</Text>
        <PersonCard name="Esther Howard" title="Manager" rating="4.96" />
        <PersonCard name="Dianne Russell" title="Supervisor" rating="4.93" />
      </View>
    </ScrollView>
  );
};

const getstyles = (colors: any) => {
  return StyleSheet.create({
  
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: Math.min(RFValue(22),22),
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { fontSize: Math.min(RFValue(28),28), fontWeight: 'bold' },
  cardSubtitle: { fontSize: Math.min(RFValue(16),16) },
  cardTrend: { fontSize: Math.min(RFValue(14),14), marginTop: 5 },

  section: { marginTop: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: Math.min(RFValue(18),18), fontWeight: 'bold' },
  seeAll: { fontSize: Math.min(RFValue(14),14), color: '#6A5ACD' },
  iconRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },

  featureBox: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    width: '30%',
  },
  featureLabel: {
    marginTop: 5,
    fontSize: Math.min(RFValue(13),13),
  },
  personCard: {
    padding: 15,
    marginTop: 15,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  personName: {
    fontSize: Math.min(RFValue(16),16),
    fontWeight: 'bold',
  },
  personTitle: {
    fontSize: Math.min(RFValue(14),14),
  },
  rating: {
    fontSize: Math.min(RFValue(14),14),
    marginTop: 3,
  },
});
};
export default HomeScreen;
