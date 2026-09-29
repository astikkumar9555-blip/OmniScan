require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { SupabaseClient, createClient } = require('@supabase/supabase-js/dist/index.cjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({
        status: "success",
        message: "OmniScan API is awake and ready."
    });
});

app.post('/api/register', async (req, res) => {
    try {
        const { roll_number, full_name, domain, github_handle, baseline_image_base64, consent } = req.body;

        if (!consent) {
            return res.status(400).json({ error: "Biometricconsent required." });
        }

        let final_embedding;

        try {
            const ml_responsse = await axios.post('http://localhost:8001/api/face/embed', {
                image_base64: baseline_image_base64
            });
            final_embedding = ml_responsse.data.embedding;
        }
        catch (ml_error) {
            console.warn("ML Service (Port 8001) is offline. Using fallback for developement");
            final_embedding = new Array(512).fill(0.5);
        }

        const { data, error } = await supabase
            .from('members')
            .insert([
                {
                    roll_number: roll_number,
                    full_name: full_name,
                    domain: domain,
                    github_handle: github_handle,
                    face_embedding: final_embedding,
                    consent_at: new Date()
                }
            ])
            .select();

        if (error) {
            console.error("Supabase Error:", error.message);
            return res.status(400).json({ error: error.message });
        }

        res.json({
            member_id: data[0].id,
            status: "REGISTERED"
        });
    }
    catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(PORT, () => {
    console.log("OmniScan Backend is running on port " + PORT);
});