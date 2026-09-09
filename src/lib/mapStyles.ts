export const mapStyles = [
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }] // Dark modern background for collector theme
  },
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94a3b8" }]
  },
  {
    featureType: "all",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0f172a" }]
  },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#334155" }]
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#334155" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#475569" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0f172a" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }]
  }
];
