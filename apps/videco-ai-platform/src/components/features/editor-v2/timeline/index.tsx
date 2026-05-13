/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
    Box,
    Slider,
    SliderFilledTrack,
    SliderThumb,
    SliderTrack,
} from "@chakra-ui/react";
import { FiMove } from "react-icons/fi";
import Draggable from "react-draggable";
import React, { useEffect, useRef, useState } from "react";
import VideoThumbnail from "react-video-thumbnail";
import { useEditorStore } from "src/store/editor";

type TimelineProps = {
    elements: any[];
    saveTimeLineValue: any;
    videoUrl: any;
    toggleSettingsWindow: (id: string) => void;
};
export const Timeline = ({
    elements,
    saveTimeLineValue,
    videoUrl,
    toggleSettingsWindow,
}: TimelineProps): JSX.Element => {
    const { video, setVideo, interactiveElements, updateInteractiveElements } =
        useEditorStore();
    const [sliderValue, setSliderValue] = useState(3);
    const timelineRef = useRef(null);
    const onSliderChange = (val) => {
        saveTimeLineValue(val / video.duration);
        setSliderValue(val);
        setVideo({
            ...video,
            seek: val / video.duration,
        });
    };

    function getOriginalWidthFromThePrecentage(percentage, fullValue) {
        // Convert the percentage to a decimal
        const decimalPercentage = percentage / 100;

        // Calculate the original number
        const originalNumber = decimalPercentage * fullValue;

        return originalNumber;
    }

    function calculatePercentage(originalNumber, fullValue) {
        // Ensure fullValue is not zero to avoid division by zero
        if (fullValue !== 0) {
            // Calculate the percentage
            const percentage = (originalNumber / fullValue) * 100;
            return percentage;
        } else {
            // Handle the case where fullValue is zero
            console.error("Error: fullValue should not be zero.");
            return null;
        }
    }

    const handleDragStop = (e, data) => {
        const TIMELINE_WIDTH = timelineRef.current.clientWidth - 48;

        const positionInPresentage =
            calculatePercentage(e.clientX, TIMELINE_WIDTH) - 9;

        const finalPositionInPresentage =
            positionInPresentage > 0 ? positionInPresentage.toFixed() : 0;
        console.log(
            "final",
            Number(
                (
                    (Number(finalPositionInPresentage) / 100) *
                        video.duration || 0
                ).toFixed(2),
            ),
        );
        updateInteractiveElements({
            ...data.element,
            time: Number(
                (
                    (Number(finalPositionInPresentage) / 100) *
                        video.duration || 0
                ).toFixed(2),
            ),
            pos: finalPositionInPresentage,
        });
    };
    const timelimeLength = Array.from(
        { length: Number(video.duration.toFixed(0)) * 2 },
        (_, index) => index,
    );
    const timelimeNumbers = Array.from(
        { length: Number(video.duration.toFixed(0)) },
        (_, index) => index,
    );

    useEffect(() => {
        if (video.seek) {
            setSliderValue((video.seek / video.duration) * 100);
        }
    }, [video.seek]);
    return (
        <Box pos="relative" ref={timelineRef} id="timeline" mb={1}>
            <Box pos="absolute" top={4} h="44px" w="100%" bg="#011a3b">
                <Box
                    display="flex"
                    color="whitesmoke"
                    p="2"
                    justifyContent="space-between"
                >
                    {timelimeNumbers.map((index) => (
                        <Box key={index} fontSize="sm">
                            {index}
                        </Box>
                    ))}
                    <Box fontSize="sm">{Number(video.duration.toFixed(0))}</Box>
                </Box>
                <Box
                    pos="absolute"
                    display="flex"
                    top="0"
                    w="full"
                    justifyContent="space-between"
                >
                    {timelimeLength.map((index) => (
                        <Box
                            key={index}
                            ml={2}
                            height="11px"
                            bg="white"
                            w="2px"
                            zIndex={1}
                        ></Box>
                    ))}
                </Box>
            </Box>
            <Box
                bg="blue.400"
                fontSize="xs"
                w="2px"
                mt={6}
                zIndex={2}
                pos={"absolute"}
                left={`${sliderValue}%`}
                top={0}
                height="full"
            />
            <Slider
                aria-label="slider-ex-4"
                defaultValue={Number(3)}
                max={100}
                // value={Number(
                //     ((video.seek / 100) * video.duration || 0).toFixed(2),
                // )}
                value={sliderValue}
                onChange={onSliderChange}
                zIndex={8}
            >
                <SliderTrack zIndex={18} cursor="move" bg="red.100">
                    <SliderFilledTrack zIndex={8} bg="blue.200" />
                </SliderTrack>
                <SliderThumb zIndex={18} cursor="move" boxSize={6} padding={1}>
                    <FiMove />
                </SliderThumb>
            </Slider>

            {elements?.length > 0 &&
                elements?.map((el) => (
                    <Draggable
                        key={el.id}
                        bounds="parent"
                        axis="x"
                        disabled={false}
                        // scale={1}
                        onStop={(e, data) =>
                            handleDragStop(e, { ...data, element: el })
                        }
                    >
                        <Box
                            w={Number(el?.endTime) * 50}
                            key={el.id}
                            onClick={() => toggleSettingsWindow(el)}
                            left={`${Number(el?.pos)}%`} //TODO: put on the correct position
                            bg="#adffdb"
                            border="2px solid #1c2227"
                            position="absolute"
                            // resize="horizontal"
                            // overflow="auto"
                            rounded="md"
                            cursor="pointer"
                            p={2}
                            h="50px"
                            top="61px"
                        >
                            {el.name}
                        </Box>
                    </Draggable>
                ))}
            <Box zIndex={2} bg="#1c1e27" mt="31" w="full" h="50px"></Box>
            <Box
                zIndex={2}
                bg="#1c1e27"
                mt="1"
                w="full"
                h="68px"
                pos="relative"
            >
                <Box
                    left={0}
                    overflow="hidden"
                    pos="absolute"
                    w="full"
                    top="0"
                    height="68px"
                    opacity={0.2}
                >
                    {/* <VideoThumbnail
                        videoUrl={videoUrl}
                        width="100%"
                        renderThumbnail={false}
                        height={0}
                        cors={true}
                    /> */}
                </Box>
            </Box>
        </Box>
    );
};
