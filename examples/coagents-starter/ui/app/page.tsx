"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { CopilotPopup } from "@copilotkit/react-ui";
import { useCallback, useState, useRef } from "react";
import Map, {MapRef} from 'react-map-gl';
import * as turf from "@turf/turf";

import DrawControl from "./draw-control";

import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

const TOKEN = ""

const initialViewState = {
  latitude: 37.7751,
  longitude: -122.4193,
  zoom: 11,
  bearing: 0,
  pitch: 0
};

export default function Home() {
  return (
    <>
      <YourMainContent />
      <CopilotPopup
        defaultOpen={true}
        labels={{
          title: "IO Sidekick",
          initial: "What can I help you with?",
        }}
      />
    </>
  );
}

function YourMainContent() {
  const [backgroundColor, setBackgroundColor] = useState("#ADD8E6");
  const [features, setFeatures] = useState({});

  const mapRef = useRef<MapRef>(null);

  const onSelectCity = useCallback(({longitude, latitude}: {longitude: number, latitude: number}) => {
    mapRef.current?.flyTo({center: [longitude, latitude], duration: 2000});
  }, []);

  const onUpdate = useCallback(e => {
    setFeatures(currFeatures => {
      const newFeatures = {...currFeatures};
      for (const f of e.features) {
        newFeatures[f.id] = f;
      }
      return newFeatures;
    });
  }, []);

  const onDelete = useCallback(e => {
    setFeatures(currFeatures => {
      const newFeatures = {...currFeatures};
      for (const f of e.features) {
        delete newFeatures[f.id];
      }
      return newFeatures;
    });
  }, []);
  
  useCopilotAction({
    name: "greet_user",
    available: "disabled",
    parameters: [
      {
        name: "name",
        description: "The name of the user to greet.",
      },
    ],
    render: ({ args, result, status }) => {
      return (
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b" colSpan={2}>
                greet_user called
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2 border-b">args</td>
              <td className="px-4 py-2 border-b">{JSON.stringify(args)}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b">result</td>
              <td className="px-4 py-2 border-b">{result}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 border-b">status</td>
              <td className="px-4 py-2 border-b">{status}</td>
            </tr>
          </tbody>
        </table>
      );
    },
  });
  useCopilotAction({
    name: "setBackgroundColor",
    parameters: [
      {
        name: "backgroundColor",
        description:
          "The background color to set. Make sure to pick nice colors.",
      },
    ],
    handler({ backgroundColor }) {
      setBackgroundColor(backgroundColor);
    },
  });
  useCopilotAction({
    name: "flyToLocation",
    parameters: [
      {
        name: "longitude",
        description: "The longitude of the location to fly to.",
        type: "number",
      },
      {
        name: "latitude",
        description: "The latitude of the location to fly to.",
        type: "number",
      },
    ],
    handler({ longitude, latitude }) {
      onSelectCity({longitude, latitude});
    },
  })
  useCopilotAction({
    name: "validateFeature",
    parameters: [],
    render: ({ args, result, status }) => {

      let feature: { [key: string]: any } = {};
      let polygonArea = 0;
    
      for (feature of Object.values(features) as { [key: string]: any }[]) {
        const polygon = turf.polygon(feature.geometry.coordinates);
        polygonArea += turf.area(polygon);
      }
      // feature['properties']['name'] = args.name;
      feature['properties']['area'] = polygonArea / 1e6;

      return (
        <p>
          {JSON.stringify(feature)}
        </p>
      )
    }
  }); 
  return (
    <>
      <Map
        ref={mapRef}
        initialViewState={initialViewState}
        mapboxAccessToken={TOKEN}
        style={{width: "100vw", height:"100vh"}}
        mapStyle="mapbox://styles/mapbox/streets-v9"
      >
        <DrawControl
          position="top-left"
          displayControlsDefault={false}
          controls={{
            polygon: true,
            trash: true
          }}
          defaultMode="draw_polygon"
          onCreate={onUpdate}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </Map>
    </>
  );
}
