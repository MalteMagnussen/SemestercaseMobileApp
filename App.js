import React, { useState, useEffect, useRef } from "react";
import {
  Platform,
  Text,
  View,
  StyleSheet,
  TouchableHighlight,
  Alert,
  TextInput,
} from "react-native";
import * as Location from "expo-location";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import Constants from "expo-constants";
import facade from "./serverFacade";
import LoginModal from "./components/loginModal";

// const SERVER_URL = "https://1bf1238a.ngrok.io";

const MyButton = ({ txt, onPressButton }) => {
  return (
    <TouchableHighlight style={styles.touchable} onPress={onPressButton}>
      <Text style={styles.touchableTxt}>{txt}</Text>
    </TouchableHighlight>
  );
};

export default App = () => {
  //HOOKS
  const [position, setPosition] = useState({ latitude: null, longitude: null });
  const [errorMessage, setErrorMessage] = useState(null);
  const [gameArea, setGameArea] = useState([]);
  const [region, setRegion] = useState(null);
  const [serverIsUp, setServerIsUp] = useState(false);
  const [status, setStatus] = useState("");
  const [loginInfo, setLoginInfo] = useState({
    userName: "t1",
    password: "secret",
  });
  const [loginMode, setLoginMode] = useState(false);
  const [distance, setDistance] = useState("10000");
  const [otherPlayers, setOtherPlayers] = useState([]);
  let mapRef = useRef(null);

  const closeModal = () => {
    setLoginMode(false);
  };

  useEffect(() => {
    getLocationAsync();
  }, []);

  useEffect(() => {
    getGameArea();
  }, []);

  const findNearbyPlayers = async () => {
    // findNearbyPlayers(userName, password, lat, lon, distance)
    const positions = await facade.findNearbyPlayers(
      loginInfo.userName,
      loginInfo.password,
      position.latitude,
      position.longitude,
      distance
    );
    setOtherPlayers(positions);
  };

  const centerOnRegion = () => {
    if (region) mapRef.current.animateToRegion(region, 1000);
  };

  useEffect(() => {
    centerOnRegion();
  }, [region]);

  async function getGameArea() {
    //Fetch gameArea via the facade, and call this method from within (top) useEffect
    try {
      const area = await facade.fetchGameArea();
      setGameArea(area);
      setServerIsUp(true);
    } catch (err) {
      setErrorMessage("Could not fetch GameArea");
    }
  }

  getLocationAsync = async () => {
    //Request permission for users location, get the location and call this method from useEffect
    let { status } = await Location.requestPermissionsAsync();
    if (status !== "granted") {
      setErrorMessage("Permission to access location was denied");
      return;
    }
    let location = await Location.getCurrentPositionAsync({
      enableHighAccuracy: true,
    });

    setPosition({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    setRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
  };

  /*
  When a press is done on the map, coordinates (lat,lon) are provided via the event object
  */
  onMapPress = async (event) => {
    //Get location from where user pressed on map, and check it against the server

    const coordinate = event.nativeEvent.coordinate;
    const lon = coordinate.longitude;
    const lat = coordinate.latitude;
    try {
      const status = await facade.isUserInArea(lon, lat);
      showStatusFromServer(setStatus, status);
    } catch (err) {
      Alert.alert("Error", "Server could not be reached");
      setServerIsUp(false);
    }
  };

  onCenterGameArea = () => {
    // (RED) Center map around the gameArea fetched from the backend
    // Alert.alert("Message", "Should center map around the gameArea");
    //Hardcoded, should be calculated as center of polygon received from server
    const latitude = 55.777055745928664;
    const longitude = 12.55897432565689;
    mapRef.current.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.04,
      },
      1000
    );
  };

  sendRealPosToServer = async () => {
    //Upload users current position to the isuserinarea endpoint and present result
    // Alert.alert(
    //   "Message",
    //   "Should send users location to the 'isuserinarea' endpoint"
    // );
    const lat = position.latitude;
    const lon = position.longitude;
    try {
      const status = await facade.isUserInArea(lon, lat);
      showStatusFromServer(setStatus, status);
    } catch (err) {
      setErrorMessage("Could not get result from server");
      setServerIsUp(false);
    }
  };

  const info = serverIsUp ? status : " Server is not up";
  return (
    <View style={{ flex: 1, paddingTop: 20 }}>
      {!region && <Text style={styles.fetching}>.. Fetching data</Text>}

      {/* Add MapView */}
      {region && (
        <MapView
          ref={mapRef}
          style={{ flex: 14 }}
          onPress={onMapPress}
          mapType="standard"
          // region={region}
          showsUserLocation
          showsCompass
        >
          {/*App MapView.Polygon to show gameArea*/}
          {serverIsUp && (
            <MapView.Polygon
              coordinates={gameArea}
              strokeWidth={1}
              onPress={onMapPress}
              fillColor="rgba(128, 153, 177, 0.5)"
            />
          )}

          {/*App MapView.Marker to show users current position*/}
          <MapView.Marker
            title="This is your position"
            pinColor="blue"
            coordinate={{
              longitude: position.longitude,
              latitude: position.latitude,
            }}
          />
          {otherPlayers.length > 0 &&
            otherPlayers.map((player, index) => (
              <MapView.Marker
                key={index}
                title={`Position of ${player.name}`}
                coordinate={{
                  longitude: player.lon,
                  latitude: player.lat,
                }}
              />
            ))}
        </MapView>
      )}

      <LoginModal
        visible={loginMode}
        closeModal={closeModal}
        setLoginInfo={setLoginInfo}
        loginInfo={loginInfo}
      />
      <Text
        numberOfLines={5}
        style={{ flex: 3, textAlign: "center", fontWeight: "bold" }}
      >
        Other Players: {JSON.stringify(otherPlayers)}
      </Text>
      <Text style={{ flex: 1, textAlign: "center", fontWeight: "bold" }}>
        Your position (lat,long): {position.latitude}, {position.longitude}
      </Text>
      <Text style={{ flex: 1, textAlign: "center" }}>{info}</Text>
      <Text style={{ flex: 1, textAlign: "center", fontWeight: "bold" }}>
        Info: UserName: {loginInfo.userName}, PassWord: {loginInfo.password}{" "}
        Distance: {distance}
      </Text>

      <View style={{ flexDirection: "row" }}>
        <TextInput
          placeholder="Set Distance"
          style={styles.input}
          value={distance}
          onChangeText={setDistance}
        />
        <MyButton
          style={{ flex: 2 }}
          onPressButton={findNearbyPlayers}
          txt="Find Nearby Players"
        />
      </View>
      <View style={{ flexDirection: "row" }}>
        <MyButton
          style={{ flex: 2 }}
          onPressButton={sendRealPosToServer}
          txt="Upload real Position"
        />

        <MyButton
          style={{ flex: 2 }}
          onPressButton={() => onCenterGameArea()}
          txt="Show Game Area"
        />
      </View>

      <MyButton
        style={{ flex: 2 }}
        onPressButton={() => setLoginMode(true)}
        txt="Set Login Info"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Constants.statusBarHeight,
    backgroundColor: "#ecf0f1",
  },
  touchable: { backgroundColor: "#4682B4", margin: 3 },
  touchableTxt: { fontSize: 22, textAlign: "center", padding: 5 },

  fetching: {
    fontSize: 35,
    flex: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Constants.statusBarHeight,
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    textAlign: "center",
  },
  inputContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    borderBottomColor: "black",
    borderWidth: 1,
    padding: 10,
    width: "40%",
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

function showStatusFromServer(setStatus, status) {
  setStatus(status.msg);
  setTimeout(() => setStatus("- - - - - - - - - - - - - - - - - - - -"), 3000);
}
