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
import { loginStyles as styles } from '@/styles/loginStyles';
import useLogin from '@/hooks/useLogin';

interface Props {
  emailFocused: boolean;
  setEmailFocused: (focus: boolean) => void;
  passwordFocused: boolean;
  setPasswordFocused: (focus: boolean) => void;
}

const LoginForm: React.FC<Props> = ({
  emailFocused,
  setEmailFocused,
  passwordFocused,
  setPasswordFocused,
}) => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    showPassword,
    setShowPassword,
    handleLogin,
  } = useLogin();

  return (
    <View style={styles.formContainer}>
      {/* Email */}
      <View style={[
        styles.inputContainer,
        emailFocused && styles.inputFocused,
        emailFocused && { transform: [{ scale: 1.02 }] },
      ]}>
        <Ionicons name="mail-outline" size={20} color={emailFocused ? '#3b82f6' : '#6b7280'} />
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

      {/* Password */}
      <View style={[
        styles.inputContainer,
        passwordFocused && styles.inputFocused,
        passwordFocused && { transform: [{ scale: 1.02 }] },
      ]}>
        <Ionicons name="lock-closed-outline" size={20} color={passwordFocused ? '#3b82f6' : '#6b7280'} />
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
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.forgotPassword}>
        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
      </TouchableOpacity>

      {/* Login */}
      <TouchableOpacity
        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
        onPress={handleLogin}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={loading ? ['#6b7280', '#6b7280'] : ['#3b82f6', '#1d4ed8']}
          style={styles.buttonGradient}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.loadingText}>Signing in...</Text>
            </View>
          ) : (
            <Text style={styles.loginButtonText}>Sign In</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <Link href="/register" asChild>
        <TouchableOpacity style={styles.registerButton} disabled={loading}>
          <Text style={styles.registerButtonText}>
            Don't have an account? <Text style={styles.registerLinkText}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

export default LoginForm;
