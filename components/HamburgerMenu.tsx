import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Modal, 
  Dimensions,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

interface MenuItemProps {
  icon: string;
  label: string;
  route: string;
  onPress: () => void;
}

const MenuItem = ({ icon, label, route, onPress }: MenuItemProps) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <IconSymbol name={icon} size={24} color="#FFFFFF" />
    <ThemedText style={styles.menuItemText}>{label}</ThemedText>
  </TouchableOpacity>
);

export function HamburgerMenu() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const { isAuthenticated, isArtist, logout } = useAuth();

  const toggleMenu = () => {
    if (menuVisible) {
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      setMenuVisible(true);
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const navigateTo = (route: string) => {
    toggleMenu();
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  };

  const menuTranslateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, 0],
  });

  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.7],
  });

  return (
    <>
      <TouchableOpacity style={styles.hamburgerButton} onPress={toggleMenu}>
        <IconSymbol name="line.3.horizontal" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={menuVisible} transparent animationType="none">
        <View style={styles.container}>
          <Animated.View 
            style={[
              styles.backdrop, 
              { opacity: backdropOpacity }
            ]} 
            onTouchEnd={toggleMenu} 
          />
          
          <Animated.View 
            style={[
              styles.menu, 
              { transform: [{ translateX: menuTranslateX }] }
            ]}
          >
            <ThemedView style={styles.menuHeader}>
              <ThemedText type="title">TATU</ThemedText>
              <TouchableOpacity onPress={toggleMenu}>
                <IconSymbol name="xmark" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </ThemedView>

            <View style={styles.menuItems}>
              <MenuItem 
                icon="safari.fill" 
                label="Explore" 
                route="/(tabs)/explore"
                onPress={() => navigateTo('/(tabs)/explore')}
              />
              
              <MenuItem 
                icon="pencil.tip" 
                label="Tattoos" 
                route="/(tabs)/tattoos"
                onPress={() => navigateTo('/(tabs)/tattoos')}
              />
              
              {isAuthenticated && (
                <MenuItem 
                  icon="calendar" 
                  label="Bookings" 
                  route="/(tabs)/bookings"
                  onPress={() => navigateTo('/(tabs)/bookings')}
                />
              )}
              
              {isArtist && (
                <>
                  <MenuItem 
                    icon="photo.on.rectangle" 
                    label="Portfolio" 
                    route="/(tabs)/portfolio"
                    onPress={() => navigateTo('/(tabs)/portfolio')}
                  />
                  
                  <MenuItem 
                    icon="calendar.badge.clock" 
                    label="Manage Bookings" 
                    route="/(tabs)/manage-bookings"
                    onPress={() => navigateTo('/(tabs)/manage-bookings')}
                  />
                </>
              )}
              
              {isAuthenticated && (
                <MenuItem 
                  icon="message.fill" 
                  label="Messages" 
                  route="/(tabs)/messages"
                  onPress={() => navigateTo('/(tabs)/messages')}
                />
              )}
              
              {isAuthenticated ? (
                <>
                  <MenuItem 
                    icon="person.fill" 
                    label="Profile" 
                    route="/(tabs)/profile"
                    onPress={() => navigateTo('/(tabs)/profile')}
                  />
                  
                  <TouchableOpacity 
                    style={[styles.menuItem, styles.logoutButton]} 
                    onPress={() => {
                      toggleMenu();
                      setTimeout(() => {
                        logout();
                      }, 300);
                    }}
                  >
                    <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color="#FFFFFF" />
                    <ThemedText style={styles.menuItemText}>Logout</ThemedText>
                  </TouchableOpacity>
                </>
              ) : (
                <MenuItem 
                  icon="person.fill" 
                  label="Login" 
                  route="/login"
                  onPress={() => navigateTo('/login')}
                />
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hamburgerButton: {
    padding: 8,
    position: 'absolute',
    top: Platform.OS === 'web' ? 12 : 48,
    left: 12,
    zIndex: 100,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  menu: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.75,
    maxWidth: 320,
    height: '100%',
    backgroundColor: '#1A1A1A',
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuItems: {
    marginTop: 25,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 25,
  },
}); 