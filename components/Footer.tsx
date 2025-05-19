import React from 'react';
import { View, Text } from 'react-native';
import { loginStyles as styles } from '@/styles/loginStyles';

const Footer: React.FC = () => (
  <View style={styles.footer}>
    <Text style={styles.footerText}>
      By signing in, you agree to our Terms of Service and Privacy Policy
    </Text>
  </View>
);

export default Footer;
