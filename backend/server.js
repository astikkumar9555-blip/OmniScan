const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req,res)=>{
    res.json({
        status: "success",
        message: "OmniScan API is awake and ready."
    });
});

app.listen(PORT, () => {
    console.log("OmniScan Backend is running on port " + PORT);
});