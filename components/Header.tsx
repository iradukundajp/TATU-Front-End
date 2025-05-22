import React from 'react';
import { View, Text } from 'react-native';
import { loginStyles as styles } from '@/styles/loginStyles';

interface HeaderProps {
  title: string;
  subtitle: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.logo}>TATU</Text>
      <Text style={styles.subtitle}>{title}</Text>
      <Text style={styles.description}>{subtitle}</Text>
    </View>
  );
};

export default Header;
