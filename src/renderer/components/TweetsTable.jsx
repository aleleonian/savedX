import React from "react";
import { useState, useContext } from "react";
import { DataTable } from "./DataTable";
import { usePagination } from "@table-library/react-table-library/pagination";
import { TweetDetailDialog } from "./TweetDetailDialog";
import { AppContext } from "../../context/AppContext";
import { BasicSelect } from "./BasicSelect";
import { debugLog } from "../util/common";

const TweetsTable = () => {
  const { state, updateState } = useContext(AppContext);
  const [searchString, setSearchString] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tweetData, setTweetData] = useState(null);
  const [paginationState, setPaginationState] = useState({ page: 0, size: 10 });

  const setTweetsData = (savedTweetsArray) => {
    updateState("savedTweets", savedTweetsArray);
  };
  const setTags = (tagsArray) => {
    updateState("tags", tagsArray);
  };

  let data = { tweetsArray: state.savedTweets };
  data = {
    nodes: data.tweetsArray.filter((item) => {
      let includeThisItem = true;

      if (tagFilter != "") {
        includeThisItem = item.tags.split(",").includes(tagFilter);
        // if a tag is set and we don't pass the tag filter, let's not include this item
        if (!includeThisItem) return false;
      }

      if (searchString != "") {
        includeThisItem = item.tweetText
          .toLowerCase()
          .includes(searchString.toLowerCase());
      }
      return includeThisItem;
    }),
  };

  const handleSearch = (event) => {
    setSearchString(event.target.value);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setTweetData(null);
  };

  const updateArrayItem = (array, id, newProperty) => {
    // Make a copy of the array
    const updatedArray = array.map((item) =>
      item.id === id
        ? { ...item, ...newProperty } // Create a new object with updated properties
        : item,
    );

    return updatedArray;
  };
  const updateTweetAndTagsLocally = (tweetToBeUpdated, tweetTags) => {
    //here i must search for the tweetToBeUpdated id in dataNdoes;
    // then update it with the new tags
    const updatedNodes = updateArrayItem(state.savedTweets, tweetToBeUpdated, {
      tags: tweetTags.join(","),
    });
    // then setTweetsData
    setTweetsData(updatedNodes);
    // i now also have to update the local array of tags
    const tagsSet = new Set(state.tags);
    for (let i = 0; i < tweetTags.length; i++) {
      if (!tagsSet.has(tweetTags[i])) tagsSet.add(tweetTags[i]);
    }
    setTags(Array.from(tagsSet));
  };

  const displayTweet = (tweetData) => {
    setTweetData(tweetData);
    setIsDialogOpen(true);
  };

  const pagination = usePagination(data, {
    state: {
      page: 0,
      size: 10,
    },
    onChange: onPaginationChange,
  });

  function onPaginationChange(action, state) {
    setPaginationState(state);
  }
  const handleTagsUpdate = (tweetId, newTags) => {
    debugLog("Updated tags:", newTags);
    window.savedXApi.updateTagsForTweet(tweetId, newTags);
    // Update the database or state with the new tags
  };

  const handleSelectChange = (filterString) => {
    setTagFilter(filterString);
  };

  const handleTagsRemoval = (tag) => {
    window.savedXApi.removeTagFromDB(tag);
  };

  return (
    <>
      <div className="search-box p-[11px] text-left flex justify-between">
        <div>Search by Tweet Text:</div>
        <div className="bg-red">
          <input
            id="search"
            type="text"
            value={searchString}
            onChange={handleSearch}
            className="border"
          />
        </div>
      </div>

      <DataTable
        dataForTable={data}
        clickHandler={displayTweet}
        pagination={paginationState}
      />

      <div className="search-box p-[11px] text-left flex justify-between">
        <div>
          <BasicSelect
            tags={state.tags}
            handleSelectChange={handleSelectChange}
          />
        </div>
      </div>
      <div className="search-box p-[11px] text-left flex justify-between">
        <div>Total Pages: {pagination.state.getTotalPages(data.nodes)}</div>
        <div>
          Page:{" "}
          {pagination.state.getPages(data.nodes).map((_, index) => (
            <button
              key={index}
              type="button"
              style={{
                fontWeight: pagination.state.page === index ? "bold" : "normal",
              }}
              onClick={() => {
                pagination.fns.onSetPage(index);
                let newState = { size: paginationState.size, page: index };
                setPaginationState(newState);
              }}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      <TweetDetailDialog
        open={isDialogOpen}
        tweetData={tweetData}
        updateTagsOnDB={handleTagsUpdate}
        removeTagFromDB={handleTagsRemoval}
        onClose={handleClose}
        updateTweetAndTagsLocally={updateTweetAndTagsLocally}
      />
    </>
  );
};

export default TweetsTable;
