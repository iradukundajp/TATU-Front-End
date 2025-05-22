import React from 'react';
import { View, StatusBar } from 'react-native';
import LoginForm from '@/components/LoginForm';
import { loginStyles } from '@/styles/loginStyles';

export default function LoginScreen() {
  return (
    <View style={loginStyles.container}>
      <StatusBar barStyle="light-content" />
      <LoginForm />
    </View>
  );
}