import React, { useState, useRef } from "react";
import { useSearchActions, Matcher } from "@yext/search-headless-react";
import type { SelectableStaticFilter } from "@yext/search-headless-react";
import { GEOLOCATE_RADIUS } from "src/config";
import { executeSearch } from "@yext/search-ui-react";
import {
  GoogleMap,
  LoadScript,
  StandaloneSearchBox,
} from "@react-google-maps/api";

const GoogleSearchBox = () => {
  const searchActions = useSearchActions();
  const searchBox = useRef();

  const onLoad = (ref) => {
    searchBox.current = ref;
    console.log("Autocomplete loaded: ", ref);
  };
  const onPlacesChanged = async () => {
    console.log(searchBox);
    const places = searchBox.current.getPlaces();
    console.log(places);
    if (places) {
      const name = places[0].name;
      const latitude = places[0].geometry.location.lat();
      const longitude = places[0].geometry.location.lng();
      // Set userlocation bias
      searchActions.setUserLocation({
        latitude: latitude,
        longitude: longitude,
      });
      const newFilter: SelectableStaticFilter = {
        displayName: name,
        selected: true,
        filter: {
          kind: "fieldValue",
          fieldId: "builtin.location",
          matcher: Matcher.Near,
          value: {
            lat: latitude,
            lng: longitude,
            radius: 1609 * GEOLOCATE_RADIUS,
          },
        },
      };
      searchActions.setStaticFilters([newFilter]);
      searchActions.setOffset(0);
      searchActions.resetFacets();
      await executeSearch(searchActions);
    }
  };

  const inputStyle = {
    boxSizing: "border-box",
    border: "1px solid transparent",
    width: "100%",
    height: "38px",
    padding: "0 12px",
    borderRadius: "3px",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
    fontSize: "14px",
    outline: "none",
    textOverflow: "ellipses",
    // position: "absolute",
    // right: "8%",
    // top: "11px",
    // marginLeft: "-120px",
  };

  return (
    <StandaloneSearchBox
      onLoad={onLoad}
      onPlacesChanged={onPlacesChanged}
      options={{
        fields: ["ALL"], //["address_components", "geometry", "icon", "name"],
      }}
      restrictions={{ country: "jp" }}
    >
      <input type="text" placeholder="Enter a location" style={inputStyle} />
    </StandaloneSearchBox>
  );
};

export default GoogleSearchBox;
