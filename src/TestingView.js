import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';

import PropTypes from 'prop-types';


const TestingView = ({ text = 'SEM CONEXÃO COM A INTERNET!',  style, textStyle, ...otherProps }) => {
  const netInfo = useNetInfo();
  const [visible, setVisible] = useState(true);

  if (!netInfo.isConnected)
    return (
      <View style={{ ...styles.container, ...style }} { ...otherProps }>
        <Text style={{ ...styles.text, ...textStyle }}>{text}</Text>
      </View>
    );
  else
    return null;
};


const styles = StyleSheet.create({
  container: {
    backgroundColor: 'red', 
  },

  text: {
    color: 'white',
    margin: 12,
  },
});


TestingView.propTypes = {
  text: PropTypes.string,
};


export { TestingView };