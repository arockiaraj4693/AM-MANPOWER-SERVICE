import React from "react";

export default function Location() {
  return (
    <div className="location-card">
      <h2>Our Location</h2>
      <p>
        3/1, Manickampillai Chathiram, Near Sipcot, Kannudaiyanpatti,
        Manapparai, Tiruchirappalli - 621 306
      </p>
      <div className="map">
        <iframe
          title="map"
          src="https://www.google.com/maps?q=Manickampillai%20Chathiram%20Near%20Sipcot%20Kannudaiyanpatti%20Manapparai%20Tiruchirappalli&output=embed"
          style={{ width: "100%", height: "60vh", border: 0 }}
        ></iframe>
      </div>
    </div>
  );
}
