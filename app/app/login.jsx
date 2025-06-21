import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from "react-native";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const toggleForm = () => {
    setIsSignup((prev) => !prev);
    setFormData({ username: "", email: "", password: "" });
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const endpoint = isSignup ? "/auth/signup" : "/auth/login";
    try {
      const res = await fetch(`http://10.0.2.2:3001${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        Toast.show({
          type: "error",
          text1: data.message || "Login failed",
        });
        return;
      }

      await SecureStore.setItemAsync("token", data.accessToken);
      await SecureStore.setItemAsync("username", data.username);

      Toast.show({
        type: "success",
        text1: "Logged in!",
      });

      router.replace("/"); // go to home
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Network error. Try again.",
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isSignup ? "Sign Up" : "Login"}</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={formData.username}
        onChangeText={(text) => handleChange("username", text)}
      />

      {isSignup && (
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          value={formData.email}
          onChangeText={(text) => handleChange("email", text)}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={formData.password}
        onChangeText={(text) => handleChange("password", text)}
      />

      <Button title={isSignup ? "Sign Up" : "Login"} onPress={handleSubmit} />

      <TouchableOpacity onPress={toggleForm}>
        <Text style={styles.switchText}>
          {isSignup ? "Already have an account? Login" : "No account? Sign Up"}
        </Text>
      </TouchableOpacity>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f9fc",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  switchText: {
    textAlign: "center",
    color: "#007bff",
    marginTop: 15,
  },
});
