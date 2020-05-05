import React, { useState } from "react";
import { StyleSheet, View, TextInput, Button, Modal } from "react-native";

const LoginModal = (props) => {
  const usernameHandler = (enteredText) => {
    props.setLoginInfo({
      password: props.loginInfo.password,
      userName: enteredText,
    });
  };
  const passwordHandler = (enteredText) => {
    props.setLoginInfo({
      userName: props.loginInfo.userName,
      password: enteredText,
    });
  };

  return (
    <Modal visible={props.visible} animationType="slide">
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Set UserName"
          style={styles.input}
          value={props.loginInfo.userName}
          onChangeText={usernameHandler}
        />
        <TextInput
          placeholder="Set Password"
          style={styles.input}
          value={props.loginInfo.password}
          onChangeText={passwordHandler}
        />
        <View style={styles.buttonContainer}>
          <View style={styles.button}>
            <Button title="Set LoginInfo" onPress={props.closeModal} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    borderBottomColor: "black",
    borderWidth: 1,
    padding: 10,
    width: "80%",
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "55%",
  },
  button: {
    width: "40%",
  },
});

export default LoginModal;
