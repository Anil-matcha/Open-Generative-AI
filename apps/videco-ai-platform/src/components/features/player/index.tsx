import {
    Box,
    Image,
    Slider,
    SliderFilledTrack,
    SliderThumb,
    SliderTrack,
    useMediaQuery,
} from "@chakra-ui/react";
import React, { useRef } from "react";
import { useState } from "react";
import {
    FiCircle,
    FiPause,
    FiPlay,
    FiVolume2,
    FiVolumeX,
} from "react-icons/fi";
import ReactPlayer from "react-player";
import { submitFormData } from "src/services/api/submitFormData";
import { useEditorStore } from "src/store/editor";
import { SettingsHover } from "./settings-hover";
import { useAnalytics } from "src/hooks/useAnalytics";
import { InteractiveButton } from "./elements/button";
import { InteractiveQuestions } from "./elements/questions";
import { InteractiveCalendar } from "./elements/calendar";
import { InteractiveForm } from "./elements/form";
import { EndScreen } from "./elements/end";

type PlayerTypes = {
    videoUrl: string;
    platform: string;
    preview: string;
    playerRef: any;
    onPlayerPlay?: any;
    playing: boolean;
    embeded?: boolean;
    videcoBrandingRemoved?: boolean;
    elements?: any[];
    isEditor?: boolean;
    setDuration: any;
    width?: any;
    id?: any;
    height?: any;
    endCTA?: any;
    setPlaying: any;
    onClickPreiveiw?: any;
    setVideo: any;
};
export const Player = ({
    videoUrl,
    playerRef,
    onPlayerPlay,
    id,
    playing,
    isEditor = false,
    endCTA,
    preview,
    embeded = false,
    width = "100%",
    height = "400px",
    setDuration,
    videcoBrandingRemoved = false,
    elements,
    setVideo,
}: PlayerTypes) => {
    const [activeElement, setActiveElement] = useState(null);
    const [isMouseInside, setIsMouseInside] = useState(false);
    const [updatedPlaying, setUpdatedPlaying] = useState(playing);
    const [isVolueClicked, setIsVolueClicked] = useState(false);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [playedSeconds, setPlayedSeconds] = useState(0);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [playerButtonHover, setPlayerButtonHover] = useState(false);
    const [answerSubmitted, setAnswerSubmitted] = useState(false);
    const [stoppedByForm, setStoppedByForm] = useState(false);
    const [showEnd, setShowEnd] = useState(false);
    const [hideForm, setHideForm] = useState(false);
    const [hideQuestion, setHideQuestion] = useState(false);
    const [activeAnswerType, setActiveAnswerType] = useState("list");
    const [previewFinished, setPreviewFinished] = useState(false);
    const [isLargerThan800] = useMediaQuery("(min-width: 670px)");

    const [volumeBar, setVolumeBar] = useState(1);
    const { updateInteractiveElements, meta, video } = useEditorStore();
    const { updateClickAnalytics } = useAnalytics();

    const constraintsRef = useRef();
    const handleVolumeChange = async (val) => {
        setVolumeBar(val);
    };
    const handleDragEnd = (e, data) => {
        setActiveElement(e);
        const updatedActiveElement = {
            ...e,
            defaultPosition: {
                x: data.x,
                y: data.y,
            },
        };

        updateInteractiveElements(updatedActiveElement);
    };
    const handleDragStart = (e, data) => {
        setActiveElement(e);
    };

    const addOpacityToHexColor = (hexColor, opacity) => {
        !hexColor && (hexColor = "#000000");
        // Convert hex to RGB
        const hex = hexColor?.replace(/^#/, "");
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Ensure opacity is in the range [0, 1]
        const normalizedOpacity = Math.max(0, Math.min(1, opacity));

        // Create rgba string
        const rgbaColor = `rgba(${r}, ${g}, ${b}, ${normalizedOpacity})`;

        return rgbaColor;
    };

    function pad(string) {
        return ("0" + string).slice(-2);
    }
    const format = (seconds) => {
        const date = new Date(seconds * 1000);
        const hh = date.getUTCHours();
        const mm = date.getUTCMinutes();
        const ss = pad(date.getUTCSeconds());
        if (hh) {
            return `${hh}:${pad(mm)}:${ss}`;
        }
        return `${mm}:${ss}`;
    };

    React.useEffect(() => {
        const findForms = elements?.filter(
            (element) => element?.type === "form",
        );
        findForms?.map((element) => {
            if (
                Number(element?.time) <=
                    Number(playerRef.current?.getCurrentTime()) &&
                Number(element?.endTime) >=
                    Number(playerRef.current?.getCurrentTime())
            ) {
                if (!stoppedByForm) {
                    setUpdatedPlaying(false);
                    setStoppedByForm(true);
                }
            }
        });
    }, [playerRef.current?.getCurrentTime()]);

    React.useEffect(() => {
        let timeoutId;
        const handleMouseEnter = () => {
            clearTimeout(timeoutId); // Clear the timeout if the mouse enters again before the delay
            setIsMouseInside(true);
        };

        const handleMouseLeave = () => {
            // Set a timeout to hide the icon after 1000 milliseconds (1 second)
            timeoutId = setTimeout(() => {
                setIsMouseInside(false);
                setIsVolueClicked(false);
            }, 1000);
        };

        return () => {
            clearTimeout(timeoutId); // Clear the timeout on component unmount
        };
    }, []); // useEffect runs once on mount
    return (
        <Box
            bg="white"
            height={height}
            // maxW="900px"
            // maxH="450px"
            ref={constraintsRef}
            margin={"0 auto"}
            sx={{
                video: {
                    objectFit: isLargerThan800 ? "cover" : "contain",
                },
            }}
            justifyContent="center"
            onMouseEnter={() => setIsMouseInside(true)}
            onMouseLeave={() => {
                setIsMouseInside(false);
                setIsVolueClicked(false);
            }}
            flexDirection="column"
            pos="relative"
            id="player-wrapper-embed"
            display="flex"
            rounded="24px"
            width={width}
        >
            <>
                {/* Video Elements */}
                {elements &&
                    elements?.map((element) =>
                        Number(element?.time) <=
                            Number(playerRef.current?.getCurrentTime()) &&
                        // @TODO: end time
                        Number(element?.endTime) >=
                            Number(playerRef.current?.getCurrentTime()) ? (
                            <>
                                {element?.type === "link" && (
                                    <InteractiveButton
                                        handleDragEnd={handleDragEnd}
                                        element={element}
                                        id={id}
                                        handleDragStart={handleDragStart}
                                        embeded={embeded}
                                        constraintsRef={constraintsRef}
                                        isLargerThan800={isLargerThan800}
                                        updateClickAnalytics={
                                            updateClickAnalytics
                                        }
                                    />
                                )}
                                {element?.type === "questions" &&
                                    !hideQuestion && (
                                        <InteractiveQuestions
                                            setFormSubmitting={
                                                setFormSubmitting
                                            }
                                            element={element}
                                            isLargerThan800={isLargerThan800}
                                            submitFormData={submitFormData}
                                            id={id}
                                            setAnswerSubmitted={
                                                setAnswerSubmitted
                                            }
                                            setActiveAnswerType={
                                                setActiveAnswerType
                                            }
                                            setHideQuestion={setHideQuestion}
                                            answerSubmitted={answerSubmitted}
                                            activeAnswerType={activeAnswerType}
                                        />
                                    )}
                                {element?.type === "calander" && (
                                    <InteractiveCalendar
                                        element={element}
                                        isLargerThan800={isLargerThan800}
                                    />
                                )}
                                {element?.type === "form" && !hideForm && (
                                    <InteractiveForm
                                        element={element}
                                        isLargerThan800={isLargerThan800}
                                        setFormSubmitting={setFormSubmitting}
                                        submitFormData={submitFormData}
                                        id={id}
                                        setFormSubmitted={setFormSubmitted}
                                        setHideForm={setHideForm}
                                        formSubmitted={formSubmitted}
                                        formSubmitting={formSubmitting}
                                        setUpdatedPlaying={setUpdatedPlaying}
                                        isEditor={isEditor}
                                    />
                                )}
                            </>
                        ) : null,
                    )}
                <>
                    {showEnd && (
                        <EndScreen
                            endCTA={endCTA}
                            videcoBrandingRemoved={videcoBrandingRemoved}
                            playerButtonHover={playerButtonHover}
                            setUpdatedPlaying={setUpdatedPlaying}
                            updatedPlaying={updatedPlaying}
                            setShowEnd={setShowEnd}
                            setPlayerButtonHover={setPlayerButtonHover}
                        />
                    )}
                </>
            </>
            <ReactPlayer
                width="100%"
                height="100vh"
                onEnded={() => {
                    setShowEnd(true);
                    setUpdatedPlaying(false);
                }}
                playsinline
                config={{
                    youtube: {
                        playerVars: {
                            controls: 0,
                            modestbranding: 1,
                            rel: 0,
                        },
                    },
                }}
                onClickPreview={() => {
                    setUpdatedPlaying(!updatedPlaying);
                    setPreviewFinished(true);
                }}
                onPlay={() => {
                    onPlayerPlay?.();
                    setShowEnd(false);
                }}
                controls={false}
                ref={playerRef}
                light={preview ?? false}
                volume={volumeBar}
                style={{
                    border: "0",
                    objectFit: isLargerThan800 ? "cover" : "contain",
                    borderRadius: "24px",
                    backgroundColor: "transparent",
                    overflow: "hidden",
                    padding: "0",
                }}
                onProgress={(e) => {
                    setPlayedSeconds(e.playedSeconds);
                }}
                onDuration={(e) => {
                    setDuration(e);
                    setVideo({ ...video, duration: Number(e) });
                }}
                pip={true}
                playing={updatedPlaying}
                autoplay={true}
                url={videoUrl}
            />
            {/* Controls */}
            {(isMouseInside ||
                !updatedPlaying ||
                (!updatedPlaying && !preview)) && (
                <Box
                    pos="absolute"
                    left="50%"
                    zIndex={990}
                    display="flex"
                    transform="translate(-50%, -0%)"
                    bottom="0"
                    rounded="2xl"
                    background={"rgb(0 0 0 / 5%)"}
                    opacity={0.9}
                    padding="15px"
                    w="100%"
                    justifyContent="space-between"
                    alignItems="center"
                    verticalAlign={"middle"}
                >
                    <Box
                        display="flex"
                        boxShadow="xl"
                        justifyContent="space-between"
                        alignItems="center"
                        color="white"
                    >
                        <Box
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                        >
                            <Box
                                onClick={() =>
                                    setUpdatedPlaying(!updatedPlaying)
                                }
                                cursor="pointer"
                                mr={3}
                            >
                                {updatedPlaying ? (
                                    <FiPause
                                        size="20"
                                        color="white"
                                        fill={
                                            playerButtonHover
                                                ? "white"
                                                : "transparent"
                                        }
                                        onMouseEnter={() =>
                                            setPlayerButtonHover(true)
                                        }
                                        onMouseLeave={() =>
                                            setPlayerButtonHover(false)
                                        }
                                        cursor={"pointer"}
                                    />
                                ) : (
                                    <FiPlay
                                        size="20"
                                        color="white"
                                        fill={
                                            playerButtonHover
                                                ? "white"
                                                : "transparent"
                                        }
                                        id="player-play"
                                        onMouseEnter={() =>
                                            setPlayerButtonHover(true)
                                        }
                                        onMouseLeave={() =>
                                            setPlayerButtonHover(false)
                                        }
                                        cursor={"pointer"}
                                    />
                                )}
                            </Box>
                        </Box>
                    </Box>
                    {/* Timeline */}
                    <Box w="full" pos="relative" zIndex={500} top="3px">
                        <Slider
                            aria-label="slider-ex-4"
                            defaultValue={0}
                            value={playedSeconds / video.duration}
                            step={0.01}
                            ml={0}
                            width="97%"
                            max={1}
                            onChange={(val) => {
                                playerRef.current?.seekTo(val);
                            }}
                        >
                            <SliderTrack
                                bg={addOpacityToHexColor(meta.player?.bg, 0.4)}
                            >
                                <SliderFilledTrack bg={meta.player?.bg} />
                            </SliderTrack>
                            <SliderThumb boxSize={4}>
                                <Box as={FiCircle} />
                            </SliderThumb>
                        </Slider>
                        {!embeded &&
                            elements &&
                            elements?.map((element) => (
                                <SettingsHover
                                    activeElement={element}
                                    playerRef={playerRef}
                                />
                            ))}
                    </Box>
                    {!videcoBrandingRemoved && (
                        <Box mr={3} bg="white" opacity={0.8} p={2} rounded="md">
                            <Image h={3} src="/logo.svg" />
                        </Box>
                    )}
                    {/* Volume & Time */}
                    <Box color="white" fontSize="sm">
                        <time
                            style={{
                                marginRight: "3px",
                            }}
                            dateTime={`P${Math.round(playedSeconds)}S`}
                        >
                            {format(playedSeconds)}
                        </time>
                    </Box>
                    {/* /
                    <time
                        style={{
                            marginLeft: "3px",
                        }}
                        dateTime={`P${Math.round(playedSeconds)}S`}
                    >
                        {format(video.duration)}
                    </time> */}
                    <Box display="flex" mt="0">
                        {isVolueClicked && isMouseInside && (
                            <Box pos="absolute" bottom="30px" right="20px">
                                <Slider
                                    colorScheme="green"
                                    aria-label="slider-ex-3"
                                    defaultValue={100}
                                    min={0}
                                    step={0.01}
                                    max={1}
                                    value={volumeBar}
                                    onChange={handleVolumeChange}
                                    orientation="vertical"
                                    minH="32"
                                >
                                    <SliderTrack
                                        bg={addOpacityToHexColor(
                                            meta.player?.bg,
                                            0.4,
                                        )}
                                    >
                                        <SliderFilledTrack
                                            bg={meta.player?.bg}
                                        />
                                    </SliderTrack>
                                    <SliderThumb />
                                </Slider>
                            </Box>
                        )}
                        {volumeBar === 0 ? (
                            <FiVolumeX
                                size="20"
                                color="white"
                                onMouseOver={() =>
                                    setIsVolueClicked(!isVolueClicked)
                                }
                                cursor="pointer"
                            />
                        ) : (
                            <FiVolume2
                                cursor="pointer"
                                onMouseOver={() =>
                                    setIsVolueClicked(!isVolueClicked)
                                }
                                size="20"
                                color="white"
                            />
                        )}
                    </Box>
                </Box>
            )}
        </Box>
    );
};
