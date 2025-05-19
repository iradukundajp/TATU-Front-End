import React, { useState } from 'react';
import { View, StatusBar, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { registerStyles as styles } from '@/styles/registerStyles';
import Header from '../components/Header';
import RegisterForm from '../components/RegisterForm';
import Footer from '../components/Footer';

export default function RegisterScreen() {
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          <Header title="Join the community" subtitle="Create your account and start your tattoo journey" />
          <RegisterForm
            nameFocused={nameFocused}
            setNameFocused={setNameFocused}
            emailFocused={emailFocused}
            setEmailFocused={setEmailFocused}
            passwordFocused={passwordFocused}
            setPasswordFocused={setPasswordFocused}
          />
          <Footer />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
