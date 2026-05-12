import React, { useState, useEffect, useCallback, useRef } from "react";
import Map, {
  NavigationControl,
  Marker,
  Source,
  Layer,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { api } from "../api/client";

const BANDUNG_CENTER = { lat: -6.9175, lng: 107.6191 };
const DEFAULT_ZOOM = 14;
const DEFAULT_RADIUS = 100;
const MIN_RADIUS = 10;
const MAX_RADIUS = 5000;

function geojsonCircle(lat, lng, radiusMeters) {
  const points = 64;
  const coords = [];
  const d2r = Math.PI / 180;
  const rDeg = (radiusMeters / 6371000) * (180 / Math.PI);
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    coords.push([
      lng + (rDeg * Math.cos(angle)) / Math.cos(lat * d2r),
      lat + rDeg * Math.sin(angle),
    ]);
  }
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
  };
}

/** Returns a GeoJSON line from center northward to the circle edge + label point */
function radiusIndicator(lat, lng, radiusMeters) {
  const d2r = Math.PI / 180;
  const rDeg = (radiusMeters / 6371000) * (180 / Math.PI);
  const edgeLat = lat + rDeg;
  const edgeLng = lng;
  const midLat = lat + rDeg / 2;
  return {
    line: {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [lng, lat],
          [edgeLng, edgeLat],
        ],
      },
    },
    label: {
      type: "Feature",
      geometry: { type: "Point", coordinates: [edgeLng, midLat] },
      properties: { radius: radiusMeters },
    },
  };
}

export default function AdminGeofence() {
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [geofenceEnabled, setGeofenceEnabled] = useState(true);
  const [toggling, setToggling] = useState(false);

  const [editingGf, setEditingGf] = useState(null);
  const [formName, setFormName] = useState("");
  const [markerPos, setMarkerPos] = useState(BANDUNG_CENTER);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [showForm, setShowForm] = useState(false);

  const [flyTo, setFlyTo] = useState(null);

  const mapRef = useRef(null);

  const loadGeofences = useCallback(async () => {
    try {
      const data = await api.getGeofences();
      setGeofences(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGeofences();
  }, [loadGeofences]);

  // Load geofence toggle setting
  useEffect(() => {
    api
      .getGeofenceSetting()
      .then((res) => {
        setGeofenceEnabled(res.enabled);
      })
      .catch(() => {});
  }, []);

  const handleToggleGeofence = async () => {
    setToggling(true);
    try {
      const res = await api.updateGeofenceSetting(!geofenceEnabled);
      setGeofenceEnabled(res.enabled);
    } catch (err) {
      setError(err.message);
    } finally {
      setToggling(false);
    }
  };

  useEffect(() => {
    if (flyTo && mapRef.current) {
      mapRef.current.flyTo({
        center: [flyTo.lng, flyTo.lat],
        zoom: 17,
        duration: 1200,
      });
    }
  }, [flyTo]);

  const handleMapClick = useCallback(
    (e) => {
      if (showForm) {
        setMarkerPos({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      }
    },
    [showForm],
  );

  const openCreate = () => {
    setEditingGf(null);
    setFormName("");
    setMarkerPos(BANDUNG_CENTER);
    setRadius(DEFAULT_RADIUS);
    setShowForm(true);
    setError("");
    if (mapRef.current)
      mapRef.current.flyTo({
        center: [BANDUNG_CENTER.lng, BANDUNG_CENTER.lat],
        zoom: DEFAULT_ZOOM,
      });
  };

  const openEdit = (gf) => {
    setEditingGf(gf);
    setFormName(gf.name);
    setMarkerPos({ lat: gf.latitude, lng: gf.longitude });
    setRadius(gf.radius_meters ?? gf.radius ?? DEFAULT_RADIUS);
    setShowForm(true);
    setError("");
    setFlyTo({ lat: gf.latitude, lng: gf.longitude });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingGf(null);
    setError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError("Please enter a location name.");
      return;
    }
    setActionLoading(true);
    setError("");
    try {
      const payload = {
        name: formName.trim(),
        latitude: markerPos.lat,
        longitude: markerPos.lng,
        radius_meters: radius,
      };
      if (editingGf) {
        await api.updateGeofence(editingGf.id, payload);
      } else {
        await api.createGeofence(payload);
      }
      setShowForm(false);
      setEditingGf(null);
      await loadGeofences();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (gf) => {
    if (!window.confirm(`Delete geofence "${gf.name}"?`)) return;
    try {
      await api.deleteGeofence(gf.id);
      loadGeofences();
    } catch (err) {
      setError(err.message);
    }
  };

  const viewGeofence = (gf) => {
    setFlyTo({ lat: gf.latitude, lng: gf.longitude });
  };

  if (loading) {
    return (
      <div className="loading">
        <span className="spinner" /> Loading geofences...
      </div>
    );
  }

  const editRadiusIndicator = showForm
    ? radiusIndicator(markerPos.lat, markerPos.lng, radius)
    : null;

  return (
    <div className="geofence-layout">
      {/* Sidebar */}
      <div className="geofence-sidebar">
        <div className="geofence-sidebar-top">
          <div className="page-header">
            <h2>Geofence Locations</h2>
            <p>Manage allowed check-in areas.</p>
          </div>

          {error && (
            <div
              className="alert alert-error"
              style={{ marginBottom: "var(--space-3)" }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="18"
                height="18"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          {/* Geofence enforcement toggle */}
          <div
            className="geofence-toggle-row"
            style={{
              marginBottom: "var(--space-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--space-3)",
              background: "var(--color-surface-raised)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "var(--font-size-sm)",
                  marginBottom: 2,
                }}
              >
                Enforce geofence check
              </div>
              <div
                style={{
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                {geofenceEnabled
                  ? "Users must be within a geofence to start shift"
                  : "Users can start shifts from anywhere"}
              </div>
            </div>
            <button
              className={`toggle-switch ${geofenceEnabled ? "on" : "off"}`}
              onClick={handleToggleGeofence}
              disabled={toggling}
              title={
                geofenceEnabled
                  ? "Disable geofence check"
                  : "Enable geofence check"
              }
              type="button"
              style={{
                position: "relative",
                width: 48,
                height: 26,
                borderRadius: 13,
                border: "none",
                cursor: toggling ? "wait" : "pointer",
                background: geofenceEnabled ? "#22c55e" : "#6b7280",
                transition: "background 0.2s",
                flexShrink: 0,
                padding: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: geofenceEnabled ? 24 : 2,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }}
              />
            </button>
          </div>

          <div className="toolbar" style={{ marginBottom: "var(--space-3)" }}>
            <span className="gf-count-label">
              {geofences.length} location{geofences.length !== 1 ? "s" : ""}
            </span>
            {!showForm && (
              <button
                className="btn btn-primary"
                style={{
                  width: "auto",
                  padding: "var(--space-2) var(--space-4)",
                  fontSize: "var(--font-size-sm)",
                }}
                onClick={openCreate}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Location
              </button>
            )}
          </div>

          <div className="geofence-list">
            {geofences.length === 0 && !showForm ? (
              <div
                className="card empty-state"
                style={{ padding: "var(--space-6)" }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.3"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <p>
                  No geofence locations yet. Click "Add Location" to create one.
                </p>
              </div>
            ) : (
              geofences.map((gf) => (
                <div
                  className={`geofence-list-item ${editingGf && editingGf.id === gf.id ? "active" : ""}`}
                  key={gf.id}
                  onClick={() => viewGeofence(gf)}
                >
                  <div className="gf-list-info">
                    <div className="gf-list-name">{gf.name}</div>
                    <span className="gf-list-radius">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      {gf.radius_meters ?? gf.radius ?? "?"}m
                    </span>
                  </div>
                  <div
                    className="gf-list-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="btn-icon edit"
                      title="Edit"
                      onClick={() => openEdit(gf)}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className="btn-icon delete"
                      title="Delete"
                      onClick={() => handleDelete(gf)}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Form section — appears below the list when editing/creating */}
        {showForm && (
          <div className="geofence-sidebar-form">
            <form onSubmit={handleSave}>
              <h3 className="gf-form-title">
                {editingGf ? "Edit Location" : "New Location"}
              </h3>
              <p className="gf-form-hint">
                {editingGf
                  ? "Drag the marker or click the map to reposition"
                  : "Click anywhere on the map to set position"}
              </p>
              <div className="form-group">
                <label htmlFor="gf-name">Location Name</label>
                <input
                  id="gf-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="e.g. Main Office"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="gf-radius">
                  Radius: <strong>{radius}m</strong>
                </label>
                <input
                  id="gf-radius"
                  type="range"
                  min={MIN_RADIUS}
                  max={MAX_RADIUS}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="gf-radius-slider"
                />
                <div className="gf-radius-labels">
                  <span>{MIN_RADIUS}m</span>
                  <span>{MAX_RADIUS}m</span>
                </div>
              </div>
              <div className="gf-form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: "auto" }}
                  onClick={cancelForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "auto" }}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner" /> Saving...
                    </>
                  ) : editingGf ? (
                    "Update"
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="geofence-map-container">
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: BANDUNG_CENTER.lng,
            latitude: BANDUNG_CENTER.lat,
            zoom: DEFAULT_ZOOM,
            pitch: 0,
          }}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          onClick={handleMapClick}
          cursor={showForm ? "crosshair" : "grab"}
          maxPitch={0}
          pitchWithRotate={false}
          touchZoomRotate={false}
          dragRotate={false}
        >
          <NavigationControl position="top-right" showCompass={false} />

          {/* Existing geofence circles */}
          {geofences.map((gf) => {
            const lat = gf.latitude;
            const lng = gf.longitude;
            if (lat == null || lng == null) return null;
            const r = gf.radius_meters ?? gf.radius ?? 100;
            const isEditing = editingGf && editingGf.id === gf.id;
            const circleData = geojsonCircle(lat, lng, r);
            const rInd = radiusIndicator(lat, lng, r);

            return (
              <React.Fragment key={`frag-${gf.id}`}>
                <Source
                  id={`geofence-src-${gf.id}`}
                  type="geojson"
                  data={circleData}
                >
                  <Layer
                    id={`geofence-fill-${gf.id}`}
                    type="fill"
                    paint={{
                      "fill-color": isEditing ? "#f59e0b" : "#3b82f6",
                      "fill-opacity": isEditing ? 0.25 : 0.12,
                    }}
                  />

                  <Layer
                    id={`geofence-line-${gf.id}`}
                    type="line"
                    paint={{
                      "line-color": isEditing ? "#f59e0b" : "#3b82f6",
                      "line-width": isEditing ? 3 : 2,
                      "line-opacity": 0.8,
                    }}
                  />
                </Source>

                {/* Radius indicator line */}
                <Source
                  id={`radius-line-src-${gf.id}`}
                  type="geojson"
                  data={rInd.line}
                >
                  <Layer
                    id={`radius-line-${gf.id}`}
                    type="line"
                    paint={{
                      "line-color": isEditing ? "#f59e0b" : "#3b82f6",
                      "line-width": 2,
                      "line-opacity": 0.7,
                      "line-dasharray": [4, 3],
                    }}
                  />
                </Source>

                <Source
                  id={`radius-label-src-${gf.id}`}
                  type="geojson"
                  data={rInd.label}
                >
                  <Layer
                    id={`radius-label-${gf.id}`}
                    type="symbol"
                    layout={{
                      "text-field": `${r}m`,
                      "text-size": 11,
                      "text-offset": [0, -1.2],
                      "text-anchor": "bottom",
                    }}
                    paint={{
                      "text-color": isEditing ? "#92400e" : "#1e40af",
                      "text-halo-color": "rgba(255,255,255,0.8)",
                      "text-halo-width": 2,
                    }}
                  />
                </Source>
              </React.Fragment>
            );
          })}

          {/* Existing geofence markers */}
          {geofences.map((gf) => (
            <Marker
              key={`m-${gf.id}`}
              longitude={gf.longitude}
              latitude={gf.latitude}
              anchor="bottom"
            >
              <div
                className="gf-map-marker"
                style={{
                  background:
                    editingGf && editingGf.id === gf.id ? "#f59e0b" : "#3b82f6",
                }}
                title={gf.name}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
            </Marker>
          ))}

          {/* Editing geofence circle + marker + radius indicator */}
          {showForm && (
            <>
              <Source
                id="edit-geofence-src"
                type="geojson"
                data={geojsonCircle(markerPos.lat, markerPos.lng, radius)}
              >
                <Layer
                  id="edit-geofence-fill"
                  type="fill"
                  paint={{ "fill-color": "#f59e0b", "fill-opacity": 0.2 }}
                />
                <Layer
                  id="edit-geofence-line"
                  type="line"
                  paint={{
                    "line-color": "#f59e0b",
                    "line-width": 2.5,
                    "line-opacity": 0.9,
                    "line-dasharray": [3, 2],
                  }}
                />
              </Source>
              {/* Editing radius indicator */}
              <Source
                id="edit-radius-line-src"
                type="geojson"
                data={editRadiusIndicator.line}
              >
                <Layer
                  id="edit-radius-line"
                  type="line"
                  paint={{
                    "line-color": "#f59e0b",
                    "line-width": 2,
                    "line-opacity": 0.8,
                    "line-dasharray": [4, 3],
                  }}
                />
              </Source>
              <Source
                id="edit-radius-label-src"
                type="geojson"
                data={editRadiusIndicator.label}
              >
                <Layer
                  id="edit-radius-label"
                  type="symbol"
                  layout={{
                    "text-field": `${radius}m`,
                    "text-size": 11,
                    "text-offset": [0, -1.2],
                    "text-anchor": "bottom",
                  }}
                  paint={{
                    "text-color": "#92400e",
                    "text-halo-color": "rgba(255,255,255,0.8)",
                    "text-halo-width": 2,
                  }}
                />
              </Source>
              <Marker
                longitude={markerPos.lng}
                latitude={markerPos.lat}
                anchor="bottom"
                draggable
                onDragEnd={(e) =>
                  setMarkerPos({ lat: e.lngLat.lat, lng: e.lngLat.lng })
                }
              >
                <div
                  className="gf-map-marker"
                  style={{
                    background: "#f59e0b",
                    boxShadow: "0 0 0 4px rgba(245,158,11,0.3)",
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
              </Marker>
            </>
          )}
        </Map>
      </div>
    </div>
  );
}
