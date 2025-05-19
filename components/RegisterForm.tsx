import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { registerStyles as styles } from '@/styles/registerStyles';
import useRegister from '@/hooks/useRegister';

interface Props {
  nameFocused: boolean;
  setNameFocused: (focus: boolean) => void;
  emailFocused: boolean;
  setEmailFocused: (focus: boolean) => void;
  passwordFocused: boolean;
  setPasswordFocused: (focus: boolean) => void;
}

const RegisterForm: React.FC<Props> = ({
  nameFocused,
  setNameFocused,
  emailFocused,
  setEmailFocused,
  passwordFocused,
  setPasswordFocused,
}) => {
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
    setShowPassword,
    handleRegister,
  } = useRegister();

  return (
    <View style={styles.formContainer}>
      {/* Role Selection */}
      <View style={styles.roleSection}>
        <Text style={styles.roleSectionTitle}>I want to register as:</Text>
        <View style={styles.roleButtons}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              selectedRole === 'USER' && styles.roleButtonSelectedUser,
            ]}
            onPress={() => setSelectedRole('USER')}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View style={styles.roleButtonContent}>
              <Ionicons
                name="person-outline"
                size={20}
                color={selectedRole === 'USER' ? '#ffffff' : '#9ca3af'}
              />
              <Text
                style={[
                  styles.roleButtonText,
                  selectedRole === 'USER' && styles.roleButtonTextSelected,
                ]}
              >
                User
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleButton,
              selectedRole === 'ARTIST' && styles.roleButtonSelectedArtist,
            ]}
            onPress={() => setSelectedRole('ARTIST')}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View style={styles.roleButtonContent}>
              <Ionicons
                name="brush-outline"
                size={20}
                color={selectedRole === 'ARTIST' ? '#ffffff' : '#9ca3af'}
              />
              <Text
                style={[
                  styles.roleButtonText,
                  selectedRole === 'ARTIST' && styles.roleButtonTextSelected,
                ]}
              >
                Artist
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Name Input */}
      <View
        style={[
          styles.inputContainer,
          nameFocused && styles.inputFocused,
          nameFocused && { transform: [{ scale: 1.02 }] },
        ]}
      >
        <Ionicons
          name="person-outline"
          size={20}
          color={nameFocused ? '#3b82f6' : '#6b7280'}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Full name"
          placeholderTextColor="#6b7280"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          editable={!loading}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
        />
      </View>

      {/* Email Input */}
      <View
        style={[
          styles.inputContainer,
          emailFocused && styles.inputFocused,
          emailFocused && { transform: [{ scale: 1.02 }] },
        ]}
      >
        <Ionicons
          name="mail-outline"
          size={20}
          color={emailFocused ? '#3b82f6' : '#6b7280'}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Email address"
          placeholderTextColor="#6b7280"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
        />
      </View>

      {/* Password Input */}
      <View
        style={[
          styles.inputContainer,
          passwordFocused && styles.inputFocused,
          passwordFocused && { transform: [{ scale: 1.02 }] },
        ]}
      >
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={passwordFocused ? '#3b82f6' : '#6b7280'}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Password"
          placeholderTextColor="#6b7280"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          editable={!loading}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#6b7280"
          />
        </TouchableOpacity>
      </View>

      {/* Terms and Conditions */}
      <View style={styles.termsContainer}>
        <Text style={styles.termsText}>
          By creating an account, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>

      {/* Register Button */}
      <TouchableOpacity
        style={[
          styles.registerButton,
          loading && styles.registerButtonDisabled,
        ]}
        onPress={handleRegister}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={
            loading
              ? ['#6b7280', '#6b7280']
              : selectedRole === 'ARTIST'
              ? ['#8b5cf6', '#7c3aed']
              : ['#3b82f6', '#1d4ed8']
          }
          style={styles.buttonGradient}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.loadingText}>Creating account...</Text>
            </View>
          ) : (
            <Text style={styles.registerButtonText}>
              Create {selectedRole === 'ARTIST' ? 'Artist' : 'User'} Account
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Login Link */}
      <Link href="/login" asChild>
        <TouchableOpacity style={styles.loginButton} disabled={loading}>
          <Text style={styles.loginButtonText}>
            Already have an account?{' '}
            <Text style={styles.loginLinkText}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </Link>

      {/* Benefits Section */}
      <View style={styles.benefitsSection}>
        <Text style={styles.benefitsTitle}>
          Join thousands of tattoo enthusiasts
        </Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>10K+</Text>
            <Text style={styles.statLabel}>Artists</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#8b5cf6' }]}>50K+</Text>
            <Text style={styles.statLabel}>Users</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#10b981' }]}>100K+</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default RegisterForm;
