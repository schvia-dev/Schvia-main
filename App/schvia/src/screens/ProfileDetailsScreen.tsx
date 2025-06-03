import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, TextInput, Modal, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { getStoredStudentDetails } from '../components/getStoredStudentDetails';
import SlideToConfirmButton from '../components/SlideToConfirmButton';
import { ErrorAlert, SuccessAlert } from '../components/Alerts';
import { ngrokConfig } from '../ngrokconfig';
import { useAuth } from '../context/AuthContext';
import { removeUserData } from '../components/removeStoredStudentDetails';


const screenWidth = Dimensions.get('window').width;

const StudentDetailsScreen = () => {
  const { logout } = useAuth();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [alertHeader, setAlertHeader] = useState('');
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const modalSlideAnim = useRef(new Animated.Value(0)).current;

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    const fetchDetails = async () => {
      const details = await getStoredStudentDetails();
      setStudentDetails(details);
    };
    fetchDetails();
  }, []);

  const handleResetButton = () => {
    setShowResetModal(true);
    Animated.timing(modalSlideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCloseModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowResetModal(false));
  };

  
  const LogoutUser = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 400));
        
        await logout();
        await removeUserData();
      } catch (error) {
        console.error('Logout failed:', error);
        setAlertHeader('Logout Failed!');
        setErrorMessage('An error occurred while logging out. Please try again.');
        setShowErrorAlert(true);
      }
    };

  const handleResetButtonSubmit = () => {
    
    const payload = {
      student_id: studentDetails.student_id,
      current_password: passwords.current,
      new_password: passwords.new,
    };
    console.log('Reset Password Payload:', payload);
    
    fetch(`${ngrokConfig.ngrok_URL}/app/studentResetPassword`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then(async response => {
        const text = await response.text();
        console.log('Raw response:', text);
        try {
          const data = JSON.parse(text);
          console.log('Parsed JSON:', data);
          if (data.success) {
            setAlertHeader('Password has been reset!');
            setSuccessMessage(data.message);
            setShowSuccessAlert(true);
            setTimeout(() => {
              LogoutUser();
            }, 2000); 

          } else {
            setAlertHeader('Password Reset Failed!');
            setErrorMessage(data.message);
            setShowErrorAlert(true);
          }
        } catch (error) {
          console.error('JSON parsing error:', error);
          setAlertHeader('Password Reset Failed!');
          setErrorMessage('An error occurred while resetting password. Please try again.');
          setShowErrorAlert(true);
        }
      })
      .catch(error => {
        console.error('Fetch error:', error);
        setAlertHeader('Password Reset Failed!');
        setErrorMessage('An error occurred while resetting password. Please try again.');
        setShowErrorAlert(true);
      });


    
    handleCloseModal();
  };

  const toggleEye = (field: 'current' | 'new' | 'confirm') => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (!studentDetails) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.loadingText}>Loading student details...</Text>
      </View>
    );
  }
  console.log(studentDetails);
  return (
    <>
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.title}>Student Profile</Text>
        <View style={{ width: 24 }} /> {/* Placeholder for symmetry */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileCard}>
          <Image source={require('../assets/avatar.png')} style={styles.avatarImage} />
          <Text style={styles.nameText}>{studentDetails.student_name}</Text>
          <Text style={styles.roleText}>ID: {studentDetails.student_id}</Text>
        </View>

        {/* Reset Password Button */}
        <Pressable style={styles.resetButton} onPress={handleResetButton}>
          <Text style={styles.resetButtonText}>Reset Password</Text>
        </Pressable>

        {/* Student Details */}
        <Text style={styles.sectionTitle}>Student Details</Text>
        {Object.entries(studentDetails).map(([key, value]) => (
          <View style={styles.detailItem} key={key}>
            <Text style={styles.label}>{formatLabel(key)}:</Text>
            {/* <Text style={styles.value}>{String(value)}</Text> */}
            <Text style={styles.value}>{value?.toString() ?? 'N/A'}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Password Reset Modal */}
      <Modal visible={showResetModal} transparent animationType="fade" onRequestClose={handleCloseModal}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleCloseModal}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{
                  translateY: modalSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0],
                  }),
                }],
              },
            ]}
          >
            <Text style={styles.modalTitle}>Reset Password</Text>

            {['current', 'new', 'confirm'].map((field) => (
              <View style={styles.inputContainer} key={field}>
                <TextInput
                  style={styles.input}
                  placeholder={`${field === 'confirm' ? 'Confirm New' : formatLabel(field)} Password`}
                  placeholderTextColor={colors.text.secondary}
                  secureTextEntry={!showPassword[field as keyof typeof showPassword]}
                  value={passwords[field as keyof typeof passwords]}
                  onChangeText={(text) => setPasswords(prev => ({ ...prev, [field]: text }))}
                />
                <Pressable onPress={() => toggleEye(field as keyof typeof showPassword)}>
                  <Ionicons
                    name={showPassword[field as keyof typeof showPassword] ? 'eye-off' : 'eye'}
                    size={24}
                    color={colors.primary}
                  />
                </Pressable>
              </View>
            ))}

            <SlideToConfirmButton
              label={
                passwords.new && passwords.confirm && passwords.new === passwords.confirm 
                  ? "Slide to Reset Password" 
                  : "Passwords do not match"
              }
              width={screenWidth * 0.9}
              onConfirmed={handleResetButtonSubmit}
              autoReset={true}
              resetDelay={1000}
              disabled={
                !passwords.current || 
                !passwords.new || 
                !passwords.confirm
              }
              disableSlide = {passwords.new !== passwords.confirm}
            />


          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
    <ErrorAlert
            visible={showErrorAlert}
            heading={alertHeader}
            description={errorMessage}
            onClose={() => setShowErrorAlert(false)}
          />
    <SuccessAlert
    visible={showSuccessAlert}
    heading={alertHeader}
    description={successMessage}
    onClose={() => setShowSuccessAlert(false)}
    />
    </>
  );
};

// 🛠️ Helper Functions
const formatLabel = (label: string) => 
  label
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase());

// 🎨 Dynamic Styles
const getStyles = (colors: any) => StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    fontSize: RFValue(16),
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: 20,
  },  

  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: RFValue(22),
    fontWeight: 'bold',
    color: colors.primary,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.avatarImageBorder,
    marginBottom: 10,
  },
  nameText: {
    fontSize: RFValue(18),
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  roleText: {
    fontSize: RFValue(14),
    color: colors.text.secondary,
  },
  resetButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
    ...colors.card.shadow,
  },
  resetButtonText: {
    color: colors.cardinfo.cardtextcolor,
    fontSize: RFValue(16),
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: RFValue(20),
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 15,
  },
  detailItem: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    ...colors.card.shadow,
  },
  label: {
    fontSize: RFValue(14),
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 5,
  },
  value: {
    fontSize: RFValue(16),
    color: colors.text.primary,
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
    minHeight: 300,
  },
  modalTitle: {
    fontSize: RFValue(20),
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {

    width: '100%',
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    paddingHorizontal: 15,
    ...colors.card.shadow,
  },
  input: {

    flex: 1,
    height: 48,
    color: colors.text.primary,
    fontSize: RFValue(16),
    paddingVertical: 10,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    ...colors.card.shadow,
  },
  submitButtonText: {
    color: colors.cardinfo.cardtextcolor,
    fontSize: RFValue(16),
    fontWeight: '600',
  },
});

export default StudentDetailsScreen;
