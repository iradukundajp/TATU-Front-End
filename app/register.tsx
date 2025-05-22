import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import RegisterForm from '@/components/RegisterForm';
import { registerStyles } from '@/styles/registerStyles';

export default function RegisterScreen() {
  return (
    <SafeAreaView style={registerStyles.container}>
      <StatusBar barStyle="light-content" />
      <RegisterForm />
    </SafeAreaView>
  );
}