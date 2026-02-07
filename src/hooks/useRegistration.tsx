import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import imageCompression from "browser-image-compression";
import { UPLOAD_URL, API_URL, CAMPAIGN_ID } from "../constants/RegistrationConstants";
import type { RouteParams } from "../constants/RegistrationConstants";

// Definición de la interfaz del hook para TypeScript
interface RegistrationHook {
    loading: boolean;
    compressing: boolean;
    preview: string | null;
    compressedFile: File | null;
    message: string;
    name: string;
    dni: string;
    phoneNumber: string;
    storeId: string | undefined;
    setName: (value: string) => void;
    setDni: (value: string) => void;
    setPhoneNumber: (value: string) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}


export const useRegistration = (): RegistrationHook => {
    // === ESTADOS ===
    const [loading, setLoading] = useState(false);
    const [compressing, setCompressing] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [compressedFile, setCompressedFile] = useState<File | null>(null);
    const [message, setMessage] = useState("");

    // Estados para los inputs
    const [name, setName] = useState('');
    const [dni, setDni] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    // === HOOKS DE ROUTER ===
    const { storeId } = useParams<RouteParams>();
    const navigate = useNavigate();

    // === MANEJADORES DE ARCHIVOS (Compresión) ===
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setCompressedFile(null);
            setPreview(null);
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);

        setCompressing(true);
        setMessage("");
        try {
            const compressed = await imageCompression(file, {
                maxSizeMB: 1, // 1MB
                maxWidthOrHeight: 800, // 800px max
                useWebWorker: true,
            });
            setCompressedFile(compressed);
        } catch (err) {
            console.error("Error al comprimir:", err);
            setMessage("❌ Error al comprimir la imagen.");
        } finally {
            setCompressing(false);
        }
    };

    // === ENVÍO DE FORMULARIO (Validación y Subida) ===
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage("");

        // ** VALIDACIONES DE LONGITUD Y OBLIGATORIEDAD **
        const trimmedName = name.trim();
        const trimmedPhone = phoneNumber.trim();
        const trimmedDni = dni.trim();

        let validationError = '';

        if (!trimmedName || !trimmedPhone || !compressedFile) {
            validationError = "❌ Nombre, Teléfono y Foto son campos obligatorios.";
        } else if (trimmedName.length > 45) {
            validationError = "❌ Nombre no debe exceder los 45 caracteres.";
        } else if (trimmedPhone.length !== 9 || !/^\d+$/.test(trimmedPhone)) {
            validationError = "❌ Teléfono debe tener exactamente 9 dígitos.";
        } else if (trimmedDni && (trimmedDni.length > 9 || !/^\d+$/.test(trimmedDni))) {
            validationError = "❌ DNI no debe exceder los 9 caracteres";
        }

        if (validationError) {
            setMessage(validationError);
            return;
        }

        if (!storeId) {
             setMessage("❌ Error crítico: ID de tienda no definido.");
             return;
        }
        
        setLoading(true);

        let photoUrl = "";

        // 1. SUBIR LA FOTO COMPRIMIDA (Servicio PHP)
        try {
            const uploadData = new FormData();
            uploadData.append("photo", compressedFile as File);

            const uploadRes = await fetch(UPLOAD_URL, {
                method: "POST",
                body: uploadData,
            });

            if (!uploadRes.ok) {
                const errorText = await uploadRes.text();
                throw new Error(`Error en la subida : ${uploadRes.status} - ${errorText}`);
            }

            const uploadJson = await uploadRes.json();
            photoUrl = uploadJson.url;
        } catch (err) {
            console.error("Error al subir la foto:", err);
            setMessage(`❌ Fallo crítico al subir la foto. ${err instanceof Error ? err.message : 'Error desconocido.'}`);
            setLoading(false);
            return;
        }

        // 2. ENVIAR PAYLOAD FINAL AL BACKEND (Render)
        const payload = {
            name: trimmedName,
            phoneNumber: trimmedPhone,
            dni: trimmedDni || undefined,
            storeId,
            campaign: CAMPAIGN_ID,
            photoUrl,
        };

        try {
            const res = await fetch(`${API_URL}/api/v1/claim`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const resJson = await res.json();

            if (res.ok) {
                const prizeName = resJson.prize || "Un gran premio!";
                const finalPhotoUrl = resJson.photoUrl || photoUrl;

                // Navegar a la página de éxito
                navigate("/exit", {
                    state: {
                        prizeName,
                        photoUrl: finalPhotoUrl,
                    },
                });
            } else {
                setMessage(`❌ ${resJson.message || "Error en el registro del premio"}`);
            }
        } catch (err) {
            setMessage("❌ No se pudo conectar al servidor de Premios (Render)");
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        compressing,
        preview,
        compressedFile,
        message,
        name,
        dni,
        phoneNumber,
        storeId,
        setName,
        setDni,
        setPhoneNumber,
        handleFileChange,
        handleSubmit,
    };
};