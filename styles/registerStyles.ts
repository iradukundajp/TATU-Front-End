import { StyleSheet, Dimensions, Platform } from 'react-native';

const { height } = Dimensions.get('window');

export const registerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.08,
    marginBottom: 30,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 6,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formContainer: {
    marginTop: 20,
  },
  roleSection: {
    marginBottom: 30,
  },
  roleSectionTitle: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  roleButtonSelectedUser: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  roleButtonSelectedArtist: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  roleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  roleButtonText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '500',
  },
  roleButtonTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  textInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#ffffff',
    paddingVertical: 4,
  },
  eyeIcon: {
    padding: 4,
  },
  termsContainer: {
    marginBottom: 30,
  },
  termsText: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#3b82f6',
    textDecorationLine: 'underline',
  },
  registerButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: '#9ca3af',
    fontSize: 14,
    marginHorizontal: 16,
    fontWeight: '500',
  },
  loginButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loginButtonText: {
    color: '#e5e7eb',
    fontSize: 16,
  },
  loginLinkText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  benefitsSection: {
    marginTop: 40,
    alignItems: 'center',
  },
  benefitsTitle: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
