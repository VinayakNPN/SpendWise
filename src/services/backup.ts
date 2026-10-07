import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Alert } from "react-native";
import { importDatabaseFromJSON } from "./database";

export const pickAndRestoreBackup = async (): Promise<boolean> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    if (result.canceled) return false;

    const file = result.assets[0];
    const fileContent = await FileSystem.readAsStringAsync(file.uri);
    
    let data;
    try {
      data = JSON.parse(fileContent);
    } catch (e) {
      Alert.alert("Invalid Backup File", "The selected file is not a valid JSON backup.");
      return false;
    }

    if (!data.schema_version) {
      Alert.alert("Invalid Backup File", "Missing schema version.");
      return false;
    }

    // In the future, we can add schema migration logic here before importing.
    // For now, database.ts's importDatabaseFromJSON handles schema 4 robustly.
    
    importDatabaseFromJSON(fileContent);
    Alert.alert("Restore Successful", "Your data has been successfully restored. Please restart the app for all changes to take effect.");
    return true;

  } catch (error: any) {
    Alert.alert("Restore Failed", error.message || "Something went wrong.");
    return false;
  }
};
