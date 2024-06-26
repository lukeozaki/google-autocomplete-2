import React, { useState, useRef, useEffect } from "react";
import { useSearchActions, Matcher } from "@yext/search-headless-react";
import type { SelectableStaticFilter } from "@yext/search-headless-react";
import { GEOLOCATE_RADIUS } from "src/config";
// import { executeSearch } from "@yext/search-ui-react";
import { encodeStaticFilters } from "src/components/search/utils/filterEncodings";
import { LoadScript } from "@react-google-maps/api";
import { getGoogleMapKey } from "src/common/getMapKey";

import "src/components/search/GooglePredictionsBox.css";

const GooglePredictionsBoxWithoutMap = () => {
  const searchActions = useSearchActions();
  // const [isMap, setMap] = useState(false);
  const containerRef = useRef(null);
  const resultsRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    initAutocomplete();
  }, []);

  const PlacesChanged = async (
    query: string,
    latitude: number,
    longitude: number
  ) => {
    console.log(query, latitude, longitude);
    if (latitude) {
      // Set userlocation bias
      searchActions.setUserLocation({
        latitude: latitude,
        longitude: longitude,
      });
      const newFilter: SelectableStaticFilter = {
        displayName: query,
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
      const searchParams = encodeStaticFilters([newFilter]);
      const searcherPath = "/search";

      if (searchParams) {
        window.location.href = `${searcherPath}?${searchParams.toString()}`;
      }
      //   searchActions.setStaticFilters([newFilter]);
      //   searchActions.setOffset(0);
      //   searchActions.resetFacets();
      //   await executeSearch(searchActions);
    }
  };

  function debounce(func: any, wait: number, immediate = false) {
    let timeout: number;
    return function () {
      const context = this,
        args = arguments;
      const later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  const initAutocomplete = () => {
    const autocomplete_results = resultsRef.current;
    const service = window.google
      ? new window.google.maps.places.AutocompleteService()
      : "";
    // const map = mapRefCur?._map?.map;
    const geocoder = new google.maps.Geocoder();

    const getPredictions = (query: string) => {
      const liveAPIKey = YEXT_PUBLIC_LIVE_API_KEY,
        limit = 3,
        entityTypes = "location",
        savedFilterIds = "";
      const yextUrl = `https://sbx-cdn.yextapis.com/v2/accounts/me/entities?api_key=${liveAPIKey}&v=20240306&entityTypes=${entityTypes}&filter={$or:[{name:{$contains:"${query}"}}]}&fields=name,yextDisplayCoordinate,googlePlaceId&savedFilterIds=${savedFilterIds}&limit=${limit}`;
      const googleAutoCompleteService = window.google
        ? new window.google.maps.places.AutocompleteService()
        : "";

      return Promise.all([
        fetch(yextUrl, {
          method: "GET",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
          },
        })
          .then((resp) => resp.json())
          .then((data) =>
            data.response.entities.map((entity: any) => ({
              description: entity.name,
              types: [],
              yextDisplayCoordinate: entity.yextDisplayCoordinate,
              googlePlceId: entity.googlePlceId,
            }))
          ),
        new Promise((resolve, reject) => {
          googleAutoCompleteService.getPlacePredictions(
            {
              input: query,
              // types: ["geocode"],
              // componentRestrictions: {
              //   country: "JP",
              // },
            },
            (predictions: any, status: any) => {
              if (
                status != window.google.maps.places.PlacesServiceStatus.OK &&
                status !=
                  window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS
              ) {
                reject(status);
                return;
              }
              resolve(predictions || []);
            }
          );
        }),
      ]).then(([yextPredictions, googlePredictions]) => {
        displaySuggestions(yextPredictions, googlePredictions);
      });
    };

    const displaySuggestions = function (yextPredictions, googlePredictions) {
      let results_html = [];
      console.log(yextPredictions, googlePredictions);

      yextPredictions.forEach(function (prediction: any) {
        const desc = prediction.description;
        const { latitude, longitude } = prediction.yextDisplayCoordinate;
        const place_id = prediction.place_id ?? '""';
        results_html.push(
          `<li class="autocomplete-item" data-type="place" data-place-id=${place_id} data-yext-lat=${latitude} data-yext-lng=${longitude}><span class="autocomplete-icon icon-localities"></span>      			    <span class="autocomplete-text">${desc}</span></li>`
        );
      });
      googlePredictions.forEach(function (prediction: any) {
        const desc = prediction.description.replace("日本、", "");
        results_html.push(
          `<li class="autocomplete-item" data-type="place" data-place-id=${prediction.place_id}><span class="autocomplete-icon icon-localities"></span>      			    <span class="autocomplete-text">${desc}</span></li>`
        );
      });
      if (autocomplete_results) {
        autocomplete_results.innerHTML = results_html.join("");
        autocomplete_results.style.display = "block";
        const autocomplete_items =
          autocomplete_results.querySelectorAll(".autocomplete-item");
        for (const autocomplete_item of autocomplete_items) {
          autocomplete_item.addEventListener("click", function () {
            const selected_text =
              this.querySelector(".autocomplete-text").textContent;
            const place_id = this.getAttribute("data-place-id");
            if (place_id) {
              geocoder.geocode(
                { placeId: place_id },
                function (results, status) {
                  if (status == "OK") {
                    if (!results[0].geometry) {
                      console.log("Returned place contains no geometry");
                      return;
                    }
                    PlacesChanged(
                      selected_text,
                      results[0].geometry.location.lat(),
                      results[0].geometry.location.lng()
                    );
                  }
                  autocomplete_input.value = selected_text;
                  autocomplete_results.style.display = "none";
                }
              );
            } else {
              PlacesChanged(
                selected_text,
                Number(this.getAttribute("data-yext-lat")),
                Number(this.getAttribute("data-yext-lng"))
              );
              autocomplete_input.value = selected_text;
              autocomplete_results.style.display = "none";
            }
          });
        }
      }
    };
    const autocomplete_input = inputRef.current;
    console.log(autocomplete_input);
    autocomplete_input.addEventListener(
      "input",
      debounce(function () {
        let value = this.value;
        console.log(value);
        value.replace('"', '\\"').replace(/^\s+|\s+$/g, "");
        if (value !== "") {
          getPredictions(value);
          // service.getQueryPredictions({
          // service.getPlacePredictions(
          //   {
          //     input: value,
          //   },
          //   displaySuggestions
          // );
        } else {
          autocomplete_results.innerHTML = "";
          autocomplete_results.style.display = "none";
        }
      }, 500)
    );
  };

  return (
    <div className="autocomplete-input-container" ref={containerRef}>
      <div className="autocomplete-input">
        <input
          id="my-input-autocomplete"
          placeholder="AutocompleteService"
          autoComplete="off"
          role="combobox"
          ref={inputRef}
        />
      </div>
      <ul className="autocomplete-results" ref={resultsRef}></ul>
    </div>
  );
};

const GooglePredictionsBox = () => {
  const mapKey = getGoogleMapKey();
  return (
    <LoadScript libraries={["places", "geocoding"]} language="ja" {...mapKey}>
      <GooglePredictionsBoxWithoutMap />
    </LoadScript>
  );
};

export default GooglePredictionsBox;
