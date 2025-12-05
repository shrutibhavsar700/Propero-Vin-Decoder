import { useState } from "react";

export default function VinDecoder() {
  const [vin, setVin] = useState("");
  const [vehicleData, setVehicleData] = useState(null);

  const handleDecode = async () => {
  if (vin.length !== 17) {
    alert("VIN must be 17 characters long");
    return;
  }

  const response = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`
  );

  const data = await response.json();

  setVehicleData(data);
};



  return (
    <div style={{ maxWidth: "500px", margin: "40px auto" , paddingLeft: "600px"  }}>
      <h2>VIN Decoder</h2>

      <input
        type="text"
        placeholder="Enter 17-character VIN"
        value={vin}
        onChange={(e) => setVin(e.target.value.toUpperCase())}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "16px",
          marginBottom: "10px"
        }}
      />

      <button
        onClick={handleDecode}
        style={{
          padding: "10px 15px",
          fontSize: "16px",
          cursor: "pointer"
        }}
      >
        Decode VIN
      </button>

      {vehicleData && vehicleData.Results && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            border: "1px solid #ccc",
            borderRadius: "6px"
          }}
        >
          <h3>Vehicle Details</h3>

          <p><strong>Make:</strong> {
  vehicleData.Results.find(r => r.Variable === "Make")?.Value || "N/A"
}</p>

<p><strong>Model:</strong> {
  vehicleData.Results.find(r => r.Variable === "Model")?.Value || "N/A"
}</p>

<p><strong>Year:</strong> {
  vehicleData.Results.find(r => r.Variable === "Model Year")?.Value || "N/A"
}</p>

<p><strong>Body Class:</strong> {
  vehicleData.Results.find(r => r.Variable === "Body Class")?.Value || "N/A"
}</p>

<p><strong>Engine:</strong> {
  vehicleData.Results.find(r => r.Variable === "Engine Model")?.Value || "N/A"
}</p>

<p><strong>Country:</strong> {
  vehicleData.Results.find(r => r.Variable === "Plant Country")?.Value || "N/A"
}</p>

        </div>
      )}
    </div>
  );
}
