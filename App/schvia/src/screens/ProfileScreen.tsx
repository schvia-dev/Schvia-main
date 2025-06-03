import React, { useState, useRef , useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Animated, Image, Modal, TouchableOpacity , ScrollView, Alert} from 'react-native';
// import { PieChart } from 'react-native-chart-kit';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RFValue } from "react-native-responsive-fontsize";
import { getStoredStudentDetails } from '../components/getStoredStudentDetails';
import { removeUserData } from '../components/removeStoredStudentDetails';
import { useAuth } from '../context/AuthContext';
import SlideToConfirmButton from '../components/SlideToConfirmButton';
const screenWidth = Dimensions.get('window').width;
import { AnimatedCircularProgress } from 'react-native-circular-progress';




type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  ProfileDetailsScreen:undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>;
};

const AccountScreen = ({ navigation }: Props) => {
  const { logout } = useAuth();
  const [userdata, setUserdata] = useState<any | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      const data = await getStoredStudentDetails();
      setUserdata(data);
    };

    fetchData();
  }, []);
  const { colors, theme, toggleTheme } = useTheme();
  const styles = getStyles(colors);
  const scaleAnim = new Animated.Value(1);
  const [showLogout, setShowLogout] = useState(false);
  const logoutSlideAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.8,
      useNativeDriver: true,
    }).start();
  };
  if(!userdata) {
    return null;
  }
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };
  const presentPercent = Number(userdata.student_attendence_percentage);
  const absentPercent = Number(userdata.student_attendence_absent_percentage);

  const pieData = [
    {
      name: `Present`,
      population: presentPercent,
      color: colors.primary,
      legendFontColor: colors.text.primary,
      legendFontSize: Math.min(RFValue(14),14),
    },
    {
      name: `Absent`,
      population: absentPercent,
      color: colors.absent,
      legendFontColor: colors.text.primary,
      legendFontSize: Math.min(RFValue(14),14),
    },
  ];


  const handleLogout = () => {
    setShowLogout(true);
    Animated.timing(logoutSlideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  const handleStudentDetailPress = () => {
    navigation.navigate('ProfileDetailsScreen');
  };
  
  const handleCloseLogout = () => {
    Animated.timing(logoutSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowLogout(false);
    });
  };

  const handleConfirmLogout = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      await logout();
      await removeUserData();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleLogout}
        >
          <Animated.View style={[
            styles.themeButton,
            { transform: [{ scale: scaleAnim }] }
          ]}>
            <Ionicons
              name="log-out-outline"
              size={24}
              color={colors.primary}
            />
          </Animated.View>
        </Pressable>
        <Text style={styles.title}>Account</Text>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={toggleTheme}
        >
          <Animated.View style={[
            styles.themeButton,
            { transform: [{ scale: scaleAnim }] }
          ]}>
            <Ionicons
              name={theme === 'light' ? 'moon-outline' : 'sunny-outline'}
              size={24}
              color={colors.primary}
            />
          </Animated.View>
        </Pressable>
      </View>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentContainerStyle={styles.scrollViewContent}
      >

        <View style={styles.contentContainer}>
        {/*this is for student profile details card*/}
          <View style={{ width: '100%' }}>
          <TouchableOpacity 
            onPress={handleStudentDetailPress} 
            style={{ width: '100%' }} // make touchable take full width
            activeOpacity={0.8}
          >
            <View style={styles.card}>
              <View style={styles.profileHeader}>
                <Image 
                  source={require('../assets/avatar.png')} 
                  style={styles.avatarImage} 
                />
                <View style={styles.profileInfo}>
                  <Text style={styles.nameText}>{userdata.student_name}</Text>
                  <Text style={styles.roleText}>ID: {userdata.student_id}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
        
          <View style={styles.attendanceCard}>
          <Text style={styles.attendanceTitle}>Attendance</Text>
          <View style={styles.attendanceContent}>
            <View style={styles.CircularProgressContainer}>
            <AnimatedCircularProgress
              // size={140}
              size={screenWidth / 3}
              width={15}
              fill={presentPercent}
              tintColor={colors.primary}
              backgroundColor={colors.absent}
              rotation={0}
              lineCap="round"
              duration={1500}
            >
              {() => (
                <Text style={{
                  fontSize: RFValue(18),
                  color: colors.text.primary,
                  fontWeight: 'bold',
                }}>
                  {`${" "}`}
                </Text>
              )}
            </AnimatedCircularProgress>
          </View>
            <View style={styles.attendancePercentageContainer}>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.legendText}>Present {presentPercent}%</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: colors.absent }]} />
                <Text style={styles.legendText}>Absent {absentPercent}%</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.cardRow}>
          <View style={styles.halfCard}>
            <View style={styles.cardHeader}>
              <FontAwesome5 name="graduation-cap" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>Academics</Text>
            </View>
            <Text style={styles.cgpaText}>CGPA</Text>
            <Text style={styles.cgpaValue}>8.76</Text>
          </View>

          <View style={styles.halfCard}>
            <View style={styles.cardHeader}>
              <FontAwesome5 name="money-bill-wave" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>Fee Payment</Text>
            </View>
            <Text style={styles.feeAmount}>₹45,000</Text>
            <Text style={styles.dueDate}>Due: 30 Dec 2023</Text>
          </View>
        </View>
      </View>

      </ScrollView>
      <Modal
        visible={showLogout}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseLogout}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseLogout}
        >
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [{
                  translateY: logoutSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0]
                  })
                }]
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Do you want to log out?</Text>
              <TouchableOpacity onPress={handleCloseLogout}>
                <FontAwesome5 name="times" size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleConfirmLogout}
            >
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity> */}
            <SlideToConfirmButton
              label="Slide to Submit"
              width={Dimensions.get('window').width * 0.9}
              onConfirmed={handleConfirmLogout}
              autoReset={true}
              resetDelay={1000}
            />

          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const getStyles = (colors: any) => {
  return StyleSheet.create({
    scrollView: {
      flex: 1,
      width: '100%',
    },
    scrollViewContent: {
      flexGrow: 1,
    },
    container: {
      flex: 1,
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: Math.min(RFValue(22),22),
      fontWeight: '700',
      color: colors.primary,
      textAlign: 'center',
      flex: 1,
    },
    contentContainer: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 10,  // Reduced from 20
    },
    card: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 20,
      width: '100%',
      marginBottom: 15,
      ...colors.card.shadow,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginBottom: 10,
    },
    avatarImage: {
      width: 100,
      height: 100,
      borderRadius: 30,
      borderWidth: 2,
      borderColor: colors.avatarImageBorder,
      marginRight: 20,
      marginLeft: 5,
    },
    profileInfo: {
      flex: 1,
    },
    nameText: {
      fontSize: Math.min(RFValue(18),18),
      fontWeight: '600',
      color: colors.cardinfo.cardtextcolor,
      marginBottom: 4,
    },
    roleText: {
      fontSize: Math.min(RFValue(14),14),
      fontWeight: '600',
      color: colors.cardinfo.cardtextcolorsecondary,
    },
    attendanceCard: {
      backgroundColor: colors.white,
      borderRadius: 16,
      padding: 20,
      width: '100%',
      alignItems: 'center',
      ...colors.card.shadow,
    },
    attendanceTitle: {
      fontSize: Math.min(RFValue(20),20),
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 15,
    },
    attendanceContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:'flex-start',
      width: '100%',
    },
    attendancePercentageContainer: {
      position:'absolute',
      right:10,
      justifyContent: 'center',
      alignItems: "flex-start",
      width: '50%',
    },
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 8,
    },
    legendText: {
      fontSize: RFValue(14),
      color: colors.text.primary,
    },
    CircularProgressContainer: {
      marginLeft: 5,
      marginRight: 5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: colors.white,
      ...colors.card.shadow,
    },
    cardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 15,
      marginBottom: 50,
    },
    halfCard: {
      backgroundColor: colors.white,
      borderRadius: 16,
      padding: 15,
      width: '48%',
      ...colors.card.shadow,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    cardTitle: {
      fontSize: Math.min(RFValue(16),16),
      fontWeight: '600',
      color: colors.text.primary,
      marginLeft: 10,
    },
    cgpaText: {
      fontSize: Math.min(RFValue(14),14),
      color: colors.text.secondary,
      marginBottom: 5,
    },
    cgpaValue: {
      fontSize: Math.min(RFValue(24),24),
      fontWeight: 'bold',
      color: colors.primary,
    },
    feeAmount: {
      fontSize: Math.min(RFValue(22),22),
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 5,
    },
    dueDate: {
      fontSize: Math.min(RFValue(14),14),
      color: colors.absent,
      fontWeight: '500',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      minHeight: 100,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -4,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: Math.min(RFValue(20),20),
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    // logoutButton: {
    //   backgroundColor: colors.primary,
    //   padding: 15,
    //   borderRadius: 10,
    //   width: '100%',
    //   alignItems: 'center',
    //   marginBottom: 5,
    //   ...colors.card.shadow,
    // },
    // buttonText: {
    //   color: colors.cardinfo.cardtextcolor,
    //   fontSize: Math.min(RFValue(16),16),
    //   fontWeight: '600',
    // }
  });
};

export default AccountScreen;
