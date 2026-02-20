import { supabase } from '../lib/supabase';

/**
 * Calls the Supabase RPC to export the entire database as a JSON object
 * and triggers a browser download.
 */
export const exportDatabaseToJson = async () => {
    try {
        const { data, error } = await supabase.rpc('export_database_json');

        if (error) {
            throw error;
        }

        if (!data) {
            throw new Error("No data received from export function");
        }

        // Create a Blob from the JSON data
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Create a link element
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Generate filename with current date
        const date = new Date().toISOString().split('T')[0];
        a.download = `curae_backup_${date}.json`;

        // Append to body, click, and remove
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        return { success: true };
    } catch (err) {
        console.error("Export Error:", err);
        return { success: false, error: err.message };
    }
};

/**
 * Parses a JSON file and calls the Supabase RPC to wipe and import the database.
 * WARNING: This is a destructive action for the current state of the database.
 */
export const importDatabaseFromJson = async (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const jsonString = e.target.result;
                const jsonData = JSON.parse(jsonString);

                // Basic validation: check if it looks like our backup structure
                if (!jsonData.patients || !jsonData.doctors || !jsonData.services) {
                    throw new Error("El archivo no tiene el formato de respaldo de Curae.");
                }

                // Call the RPC to import
                const { error } = await supabase.rpc('import_database_json', { data: jsonData });

                if (error) {
                    throw error;
                }

                resolve({ success: true });
            } catch (err) {
                console.error("Import Parsing/RPC Error:", err);
                resolve({ success: false, error: err.message });
            }
        };

        reader.onerror = () => {
            resolve({ success: false, error: "Error leyendo el archivo" });
        };

        reader.readAsText(file);
    });
};
