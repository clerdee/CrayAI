import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SwipeButton from 'rn-swipe-button';
import { FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  
  // Custom Crayfish Icon for the slider thumb
  const CrayfishThumb = () => (
    <View style={styles.thumbContainer}>
      <FontAwesome5 name="fish" size={24} color="#FFF" />
      {/* Note: FontAwesome doesn't have a crayfish, using fish as placeholder. 
          You can replace this View with an <Image> of your crayfish! */}
    </View>
  );

  return (
    <LinearGradient
      colors={['#0A2342', '#283E51']} // Deep aquatic blue gradient
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>CrayAI</Text>
        <Text style={styles.subtitle}>Australian Red Claw Classifier</Text>
      </View>

      <View style={styles.swipeContainer}>
        <SwipeButton
          title="Swipe to Start"
          titleColor="#FFFFFF"
          titleFontSize={18}
          height={65}
          width={width * 0.8}
          railBackgroundColor="#1F3A53"
          railBorderColor="#1F3A53"
          thumbIconBackgroundColor="#FF6347" // Crayfish red/orange
          thumbIconBorderColor="#FF6347"
          thumbIconComponent={CrayfishThumb}
          onSwipeSuccess={() => navigation.navigate('Home')} // Moves to Home Screen!
          shouldResetAfterSuccess={true}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 55,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 2,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#B0C4DE',
    letterSpacing: 1,
  },
  swipeContainer: {
    marginBottom: 80, 
  },
  thumbContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});