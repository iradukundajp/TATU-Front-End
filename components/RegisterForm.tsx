import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRegister } from '@/hooks/useRegister';
import { registerStyles } from '@/styles/registerStyles';

export default function RegisterForm() {
  const {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    selectedRole,
    setSelectedRole,
    loading,
    showPassword,
    handleRegister,
    togglePasswordVisibility,
    navigateToLogin
  } = useRegister();

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={registerStyles.gradient}
    >
      <ScrollView 
        contentContainerStyle={registerStyles.scrollContainer}
        keyboardShouldPersistTaps="always"
        bounces={false}
      >
        {/* Header Section */}
        <View style={registerStyles.header}>
          <Text style={registerStyles.logo}>TATU</Text>
          <Text style={registerStyles.subtitle}>Join the community</Text>
          <Text style={registerStyles.description}>
            Create your account and start your tattoo journey
          </Text>
        </View>

        {/* Form Container */}
        <View style={registerStyles.formContainer}>
          {/* Role Selection */}
          <View style={registerStyles.roleSection}>
            <Text style={registerStyles.roleSectionTitle}>I want to register as:</Text>
            <View style={registerStyles.roleButtons}>
              <TouchableOpacity
                style={[
                  registerStyles.roleButton,
                  selectedRole === 'USER' && registerStyles.roleButtonSelectedUser
                ]}
                onPress={() => setSelectedRole('USER')}
              >
                <View style={registerStyles.roleButtonContent}>
                  <Ionicons 
                    name="person-outline" 
                    size={20} 
                    color={selectedRole === 'USER' ? '#ffffff' : '#9ca3af'} 
                  />
                  <Text style={[
                    registerStyles.roleButtonText,
                    selectedRole === 'USER' && registerStyles.roleButtonTextSelected
                  ]}>User</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  registerStyles.roleButton,
                  selectedRole === 'ARTIST' && registerStyles.roleButtonSelectedArtist
                ]}
                onPress={() => setSelectedRole('ARTIST')}
              >
                <View style={registerStyles.roleButtonContent}>
                  <Ionicons 
                    name="brush-outline" 
                    size={20} 
                    color={selectedRole === 'ARTIST' ? '#ffffff' : '#9ca3af'} 
                  />
                  <Text style={[
                    registerStyles.roleButtonText,
                    selectedRole === 'ARTIST' && registerStyles.roleButtonTextSelected
                  ]}>Artist</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Simple Form Inputs */}
          <View style={registerStyles.basicInput}>
            <Text style={registerStyles.inputLabel}>Full Name</Text>
            <TextInput
              style={registerStyles.simpleInput}
              placeholder="Enter your full name"
              placeholderTextColor="#6b7280"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={registerStyles.basicInput}>
            <Text style={registerStyles.inputLabel}>Email</Text>
            <TextInput
              style={registerStyles.simpleInput}
              placeholder="Enter your email address"
              placeholderTextColor="#6b7280"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={registerStyles.basicInput}>
            <Text style={registerStyles.inputLabel}>Password</Text>
            <View style={registerStyles.passwordInputWrapper}>
              <TextInput
                style={registerStyles.passwordInput}
                placeholder="Create a password"
                placeholderTextColor="#6b7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                style={registerStyles.eyeButton}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms and Conditions */}
          <View style={registerStyles.termsContainer}>
            <Text style={registerStyles.termsText}>
              By creating an account, you agree to our{' '}
              <Text style={registerStyles.termsLink}>Terms of Service</Text>{' '}
              and{' '}
              <Text style={registerStyles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[registerStyles.registerButton, loading && registerStyles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <View style={registerStyles.buttonContent}>
              {loading ? (
                <View style={registerStyles.loadingContainer}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={registerStyles.loadingText}>Creating account...</Text>
                </View>
              ) : (
                <Text style={registerStyles.registerButtonText}>
                  Create {selectedRole === 'ARTIST' ? 'Artist' : 'User'} Account
                </Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={registerStyles.divider}>
            <View style={registerStyles.dividerLine} />
            <Text style={registerStyles.dividerText}>or</Text>
            <View style={registerStyles.dividerLine} />
          </View>

          {/* Login Link */}
          <TouchableOpacity 
            style={registerStyles.loginButton} 
            onPress={navigateToLogin}
          >
            <Text style={registerStyles.loginButtonText}>
              Already have an account? <Text style={registerStyles.loginLinkText}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Benefits Section */}
        <View style={registerStyles.benefitsSection}>
          <Text style={registerStyles.benefitsTitle}>Join thousands of tattoo enthusiasts</Text>
          <View style={registerStyles.statsContainer}>
            <View style={registerStyles.statItem}>
              <Text style={registerStyles.statNumber}>10K+</Text>
              <Text style={registerStyles.statLabel}>Artists</Text>
            </View>
            <View style={registerStyles.statItem}>
              <Text style={[registerStyles.statNumber, { color: '#8b5cf6' }]}>50K+</Text>
              <Text style={registerStyles.statLabel}>Users</Text>
            </View>
            <View style={registerStyles.statItem}>
              <Text style={[registerStyles.statNumber, { color: '#10b981' }]}>100K+</Text>
              <Text style={registerStyles.statLabel}>Bookings</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}