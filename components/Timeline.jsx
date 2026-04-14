import React, { useRef, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import Grid from '@material-ui/core/Grid';
import SVGInline from 'react-svg-inline';
import classnames from 'classnames';
import { useWindowSize } from '@react-hook/window-size';
import moment from 'moment';
import Scroll from 'timeline/lib/scroll';
import useClickOutside from 'use-click-outside';

import useProjectStore from './hooks/useProjectStore.jsx';
import useUIStore from './hooks/useUIStore.jsx';
import useTimelineStore from './hooks/useTimelineStore.jsx';

import { editorStyles } from '../lib/constants/editorStyles.js';

import TimeLineSlider from './common/timeline/TimeLineSlider.jsx';
import Layer from './common/timeline/Layer.jsx';
import SortableLayers from './common/timeline/SortableLayers.jsx';
import PlayButton from './common/timeline/PlayButton.jsx';
import PlusButton from './common/timeline/PlusButton.jsx';
import PlayTime from './common/timeline/PlayTime.jsx';
import PopcornElements from './common/timeline/PopcornElements.jsx';
import SliderArrow from './common/timeline/SliderArrow.jsx';
import TimelineRuler from './common/timeline/TimelineRuler.jsx';

// Placeholder SVG imports - will be replaced with actual icons
const plusIcon = '+';
const minusIcon = '-';
const resetIcon = '⟲';
import { mainTooltips } from '../lib/constants/tooltips.js';
import HelpIconComponent from './common/HelpIcon.jsx';
import ContextMenu from './common/timeline/ContextMenu.jsx';

//material slider
import Slider from "@material-ui/core/Slider";
import { makeStyles, withStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
  root: {
    width: 100,
    marginTop: "5px",
    color: '#52af77',
  },
});

const TimeLineZoomSlider = withStyles({
  root: {
    width: 100,
    color: '#EB5054',
  },
  thumb: {
    backgroundColor: '#EB5054',
  },
  track: {
    backgroundColor: '#EB5054',
  },
  rail: {
    backgroundColor: '#555',
  },
})(Slider);


const date = '2018-08-01 00:00:00';

const Timeline = observer(() => {
  const sortableRef = useRef(null);
  const layersRef = useRef(null);
  const timelineRef = useRef(null);
  const timelineSideRef = useRef(null);
  const projectStore = useProjectStore();
  const uiStore = useUIStore();
  const [sortableWidth, setSortableWidth] = useState(0);
  const [windowWidth] = useWindowSize();

  const {
    layers,
    duration,
    isLoaded,
    addLayer,
    removeLayer,
    moveElements,
    isPlayed,
    time,
    stopIfPlay,
  } = projectStore;

  const { isTimelineOpen, toggleTimeLine } = uiStore;

  const {
    contextMenu,
    setIsActiveTimeline,
    setTimelineHeight,
    timelineHeight,
  } = useTimelineStore();

  const startDate = moment(date);
  const [endDate, setEndDate] = useState(moment(date));
  const [zoom, setZoom] = useState(1);
  const [isShowScroll, setIsShowScroll] = useState(false);
  const [startDateWithZoom, setStartDateWithZoom] = useState(startDate);
  const [endDateWithZoom, setEndDateWithZoom] = useState(startDate);

  useClickOutside(timelineRef, () => setIsActiveTimeline(false));

  useEffect(() => {
    if (!isTimelineOpen && timelineHeight !== editorStyles.timeline.minHeight) {
      setTimelineHeight(editorStyles.timeline.minHeight);
      timelineRef.current.style.height = `${editorStyles.timeline.minHeight}px`;
    }
  }, [isTimelineOpen]);

  // If the slider is out of sight.
  useEffect(() => {
    const sliderDuration = endDateWithZoom.diff(startDate);
    const startZoom = startDateWithZoom.diff(startDate);
    if (time * 10 >= sliderDuration && sliderDuration !== duration * 10 && isPlayed) {
      // end
      const newStartZoom = startDate.diff(0) + time * 10;
      const newEndZoom = startDate.diff(0) + sliderDuration + time * 10;
      setStartDateWithZoom(moment(newStartZoom));
      setEndDateWithZoom(moment(newEndZoom));
    }
    if (time * 10 < startZoom && startZoom !== 0 && isPlayed) {
      // start
      let newStartZoom = startDate.diff(0) + time * 10;
      let newEndZoom = startDate.diff(0) + sliderDuration + time * 10;
      if (time > 10) {
        newStartZoom -= 100;
        newEndZoom -= 100;
      }
      setEndDateWithZoom(moment(newEndZoom));
      setStartDateWithZoom(moment(newStartZoom));
    }
  }, [duration, time, endDateWithZoom, startDateWithZoom, isPlayed]);

  useEffect(() => {
    setEndDate(moment(startDate.diff(0) + (duration * 10)));
  }, [duration]);

  // update endDateWithZoom
  useEffect(() => {
    const newEnd = moment(startDateWithZoom.diff(0) + (endDate.diff(startDate) * zoom));
    if (!endDateWithZoom || (endDateWithZoom.diff(0) !== newEnd.diff(0))) {
      if (endDate.diff(newEnd) <= 0) {
        setStartDateWithZoom(moment(startDateWithZoom.diff(0) - newEnd.diff(endDate)));
        setEndDateWithZoom(endDate);
      }
      setEndDateWithZoom(newEnd);
      if (+zoom !== 1) {
        setIsShowScroll(true);
      } else {
        setStartDateWithZoom(startDate);
        setEndDateWithZoom(endDate);
        setIsShowScroll(false);
      }
    }
  }, [endDate, zoom, startDateWithZoom]);

  const zoomIn = () => {
    if (zoom > 0.1) {
      setZoom((zoom - 0.1).toFixed(1));
    }
  };

  const zoomOut = () => {
    const newValue = (+zoom + 0.1).toFixed(1);
    if (newValue <= 1) {
      setZoom(newValue);
    }
  };

  const zoomReset = () => {
    setZoom(1);
  };

  const handleTimelineZoomLevel = (event, newValue) => {
    setZoom(newValue);
  };


  const onSortEnd = ({ oldIndex, newIndex }) => {
    if (oldIndex === newIndex) {
      return;
    }
    moveElements(oldIndex, newIndex);
  };

  useEffect(() => {
    if (sortableRef.current) {
      setSortableWidth(sortableRef.current.offsetWidth);
    }
  }, [windowWidth]);

  // ===== tray-resize =====
  const onTrayHandleMousedown = e => {
    e.preventDefault();
    timelineRef.current.style.transition = '0s';
    window.addEventListener('mousemove', onTrayHandleMousemove);
    window.addEventListener('mouseup', onTrayHandleMouseup);
  };

  const onTrayHandleMousemove = e => {
    const height = window.innerHeight - e.pageY;
    const headerHeight = document.querySelector('.menu-app-bar').getBoundingClientRect().height;
    const maxHeight = document.documentElement.clientHeight - headerHeight
      - editorStyles.timeline.maxDifferenceHeightPx;

    if (height <= editorStyles.timeline.minHeight) {
      timelineRef.current.style.height = `${editorStyles.timeline.minHeight}px`;
      toggleTimeLine(false);
    } else if (height >= maxHeight) {
      timelineRef.current.style.height = `${maxHeight}px`;
    } else {
      toggleTimeLine(true);
      timelineRef.current.style.height = `${height}px`;
    }
  };

  const onTrayHandleMouseup = () => {
    timelineRef.current.style.transition = '0.3s';
    window.removeEventListener('mousemove', onTrayHandleMousemove, false);
    window.removeEventListener('mouseup', onTrayHandleMouseup, false);
    const newHeight = timelineRef.current.getBoundingClientRect().height;
    setTimelineHeight(newHeight);
    if (newHeight > editorStyles.timeline.minHeight) {
      toggleTimeLine(true);
    } else {
      toggleTimeLine(false);
    }
  };
  // =======================

  const closeOpenTimeline = () => {
    if (isTimelineOpen) {
      setTimelineHeight(editorStyles.timeline.minHeight);
    } else {
      setTimelineHeight(editorStyles.timeline.defaultHeight);
    }
    timelineRef.current.removeAttribute('style');
    toggleTimeLine(!isTimelineOpen);
  };

  const classes = useStyles();


  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={classnames('timeline', { 'timeline-open': isTimelineOpen })}
      ref={timelineRef}
      onClick={() => setIsActiveTimeline(true)}
      onKeyDown={() => { }}
    >
      <div
        className="tray-resize"
        onMouseDown={onTrayHandleMousedown}
        role="button"
        tabIndex="0"
      />
      <button
        className={classnames('timeline-arrow', { 'timeline-arrow-open': isTimelineOpen })}
        onClick={closeOpenTimeline}
      />

      <div className="timeline-zoom">
        <button className="timeline-zoom__btn" onClick={zoomIn}>
          {minusIcon}
        </button>

        <div className={classes.root}>
          <TimeLineZoomSlider
            value={zoom}
            min={0}
            max={1}
            step={0.1}
            onChange={handleTimelineZoomLevel}
            aria-labelledby="continuous-slider"
          />
        </div>

        <button className="timeline-zoom__btn" onClick={zoomOut}>
          {plusIcon}
        </button>
        <button className="timeline-zoom__btn timeline-zoom__reset" onClick={zoomReset}>
          {resetIcon}
        </button>
      </div>

      <div className="timeline-top">
        <div className="timeline-top-left">
          <Grid container alignItems="center" className="timeline__btns">
            {isLoaded && (
              <PlayButton
                startDate={startDate}
                endDateWithZoom={endDateWithZoom}
              />
            )}
            <div className="tooltip-box">
              <PlusButton
                onClick={() => addLayer()}
                alt="Add Layer"
                className="timeline-add icon-button"
              />
              <HelpIconComponent placement="right-start" noPadding message={mainTooltips.timeline} />
            </div>
            <PlayTime />
          </Grid>
        </div>
        {
          isLoaded && (
            <TimeLineSlider
              startDate={startDate}
              endDate={endDate}
              startDateWithZoom={startDateWithZoom}
              endDateWithZoom={endDateWithZoom}
              setStartDateWithZoom={setStartDateWithZoom}
              setEndDateWithZoom={setEndDateWithZoom}
              sortableWidth={sortableWidth}
            />
          )
        }
      </div>

      {contextMenu?.buttons.length && contextMenu.isOpen ? <ContextMenu /> : null}

      {timelineSideRef ? (
        <SliderArrow
          sortableWidth={sortableWidth}
          time={time}
          timelineSideRef={timelineSideRef}
          startDateWithZoom={startDateWithZoom}
          endDateWithZoom={endDateWithZoom}
          startDate={startDate}
        />
      ) : null}

      <div className="layers">
        <div ref={sortableRef} className="layers-settings">
          <SortableLayers
            layers={layers}
            onSortEnd={onSortEnd}
            onRemove={(item) => removeLayer(item.id)}
          />
        </div>
        <div className="timeline-side" ref={timelineSideRef}>
          {isLoaded && (
            <>
              <TimelineRuler state={{ timelineSeconds }} zoom={zoom} />
              <PopcornElements
                startDate={startDate}
                endDate={endDate}
                startDateWithZoom={startDateWithZoom}
                endDateWithZoom={endDateWithZoom}
                zoom={zoom}
                sortableWidth={sortableWidth}
                layersRef={layersRef}
              />
            </>
          )}
        </div>
      </div>
      <div className="layers-scroll-block">
        <div className="layers-scroll-block__hidden" />
        {isShowScroll && (
          <Scroll
            startDate={startDate}
            endDate={endDate}
            scrollBarStart={startDateWithZoom}
            scrollBarEnd={endDateWithZoom}
            setStartDateWithZoom={setStartDateWithZoom}
            setEndDateWithZoom={setEndDateWithZoom}
            scrollEffect={stopIfPlay}
          />
        )}
      </div>
    </div>
  );
});

export default Timeline;