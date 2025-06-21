import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { getToken } from "../../utils/token";

export default function HomeScreen() {
  const [roomCode, setRoomCode] = useState("");
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        router.replace("/login");
      }
    })();
  }, []);

  const handleJoin = () => {
    if (!roomCode.trim()) return Alert.alert("Error", "Please enter a room code.");
    router.push(`/room/${roomCode.trim()}`);
  };

  const handleCreate = async () => {
    try {
      const token = await getToken();
      const res = await fetch("http://10.0.2.2:3001/createroom", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      router.push(`/room/${data.roomId}`);
    } catch (err) {
      console.error("Create Room Error:", err);
      Alert.alert("Error", "Could not create room.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Join or Create a Room</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Room Code"
        value={roomCode}
        onChangeText={setRoomCode}
      />
      <View style={styles.buttonContainer}>
        <Button title="Join Room" onPress={handleJoin} disabled={!roomCode.trim()} />
        <Button title="Create Room" onPress={handleCreate} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 30,
    fontWeight: "bold",
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  buttonContainer: {
    gap: 10,
  },
});
