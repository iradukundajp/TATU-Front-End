import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLogin } from '@/hooks/useLogin';
import { loginStyles } from '@/styles/loginStyles';

export default function LoginScreen() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    showPassword,
    emailFocused,
    passwordFocused,
    handleLogin,
    togglePasswordVisibility,
    handleEmailFocus,
    handleEmailBlur,
    handlePasswordFocus,
    handlePasswordBlur,
    navigateToRegister
  } = useLogin();

  return (
    <SafeAreaView style={loginStyles.container}>
      <StatusBar barStyle="light-content" />
      <View style={loginStyles.backgroundContainer}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={loginStyles.gradient}
        >
          {/* Header Section */}
          <View style={loginStyles.header}>
            <Text style={loginStyles.logo}>TATU</Text>
            <Text style={loginStyles.subtitle}>Welcome back!</Text>
            <Text style={loginStyles.description}>
              Sign in to discover amazing tattoo artists
            </Text>
          </View>

          {/* Form Container */}
          <View style={loginStyles.formContainer}>
            {/* Email Input */}
            <View style={[
              loginStyles.inputContainer,
              emailFocused && loginStyles.inputFocused
            ]}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={emailFocused ? '#3b82f6' : '#6b7280'} 
              />
              <TextInput
                style={loginStyles.textInput}
                placeholder="Email address"
                placeholderTextColor="#6b7280"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                onFocus={handleEmailFocus}
                onBlur={handleEmailBlur}
              />
            </View>

            {/* Password Input */}
            <View style={[
              loginStyles.inputContainer,
              passwordFocused && loginStyles.inputFocused
            ]}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={passwordFocused ? '#3b82f6' : '#6b7280'} 
              />
              <TextInput
                style={loginStyles.textInput}
                placeholder="Password"
                placeholderTextColor="#6b7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
                onFocus={handlePasswordFocus}
                onBlur={handlePasswordBlur}
              />
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                style={loginStyles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={loginStyles.forgotPassword}>
              <Text style={loginStyles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[loginStyles.loginButton, loading && loginStyles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <View style={loginStyles.buttonContent}>
                {loading ? (
                  <View style={loginStyles.loadingContainer}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={loginStyles.loadingText}>Signing in...</Text>
                  </View>
                ) : (
                  <Text style={loginStyles.loginButtonText}>Sign In</Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={loginStyles.divider}>
              <View style={loginStyles.dividerLine} />
              <Text style={loginStyles.dividerText}>or</Text>
              <View style={loginStyles.dividerLine} />
            </View>

            {/* Register Link */}
            <TouchableOpacity 
              style={loginStyles.registerButton} 
              disabled={loading}
              onPress={navigateToRegister}
            >
              <Text style={loginStyles.registerButtonText}>
                Don't have an account? <Text style={loginStyles.registerLinkText}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={loginStyles.footer}>
            <Text style={loginStyles.footerText}>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}