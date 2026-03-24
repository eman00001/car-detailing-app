import { useState, useEffect } from 'react';
import { View, ScrollView, Text, ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const CAR_API_BASE_URL = 'https://carapi.app';
const CAR_API_MAKES_URL = '/api/makes/v2';
const CAR_API_MODELS_URL = '/api/models/v2';
const CAR_API_TRIMS_URL = '/api/trims/v2';
const API_RESULT_LIMIT = 20; // limit each API call to at most 20 results, conditionally load rest
const EMPTY_CAR_DETAILS = { data: [], next: '' };

// default attributes of a car when they are not defined in the CarAPI result
const CAR_WIDTH_AVG_IN = 70;
const CAR_LENGTH_AVG_IN = 178;
const CAR_HEIGHT_AVG_IN = 58;
const CAR_SEATS_AVG = 5;
const CAR_DOORS_AVG = 4;

// round cost estimate to nearest multiple of 5
const DETAILING_COST_MULTIPLE = 5;

// function takes a value and rounds it to the nearest multiple of some number
const roundToNearestMultipleOf = (value, multiple) => {
    return Math.round(value / multiple) * multiple;
};

// function calculates the average surface area of a car, in square inches, by calculating the surface area of the bounding box
const estimateSurfaceAreaOfCar_In2 = (car) => {
    const w = car.width  ?? CAR_WIDTH_AVG_IN;
    const l = car.length ?? CAR_LENGTH_AVG_IN;
    const h = car.height ?? CAR_HEIGHT_AVG_IN;
    return w*l + w*h*2 + l*h*2; // add up area of all sides except bottom
}

// function calculates the estimated of doing a given detailing to a given car
const calculateEstimatedCost = (car, detailingType) => {
    const estimatedSurfaceArea = estimateSurfaceAreaOfCar_In2(car);
    const numberOfSeats = car.seats ?? CAR_SEATS_AVG;
    const numberOfDoors = car.doors ?? CAR_DOORS_AVG;
    const costRaw = detailingType.baseCost
         + (detailingType.additionalCostPerSquareInch ?? 0) * estimatedSurfaceArea
         + (detailingType.additionalCostPerSeat ?? 0) * numberOfSeats
         + (detailingType.additionalCostPerDoor ?? 0) * numberOfDoors;
    return roundToNearestMultipleOf(costRaw, DETAILING_COST_MULTIPLE);
}

// function converts a number to CAD format
const formatterCAD = Intl.NumberFormat('en-us', {
    style: 'currency',
    currency: 'CAD',
});

// the types of detailing that is offered, along with the costs associated with each
const detailingTypes = [
    {
        id: 1,
        name: 'Basic Exterior',
        description:
            'Power wash the exterior with your car, applying shine afterwards to give a sharp finish',
        baseCost: 50,
        additionalCostPerSquareInch: 0.001,
    },
    {
        id: 2,
        name: 'Basic Exterior + Interior',
        description:
            'Power wash and shine to exterior, ' +
            'as well as a thorough cleaning and refurbishing of the inside of your car',
        baseCost: 75,
        additionalCostPerSquareInch: 0.001,
        additionalCostPerSeat: 10,
    },
    {
        id: 3,
        name: 'Window Deep Clean',
        description:
            'Clean all the windows on your car to crystal clear perfection',
        baseCost: 25,
        additionalCostPerDoor: 5,
    }
];

export default function CarDetailsFormScreen() {
    // store fetched car makes and user selections
    const [carMakes, setCarMakes] = useState({ ...EMPTY_CAR_DETAILS });
    const [carMakesDropdownOpen, setCarMakesDropdownOpen] = useState(false);
    const [carMakesSearch, setCarMakesSearch] = useState('');
    const [selectedCarMake, setSelectedCarMake] = useState(null);

    // store fetched car models and user selections
    const [carModels, setCarModels] = useState({ ...EMPTY_CAR_DETAILS });
    const [carModelsDropdownOpen, setCarModelsDropdownOpen] = useState(false);
    const [carModelsSearch, setCarModelsSearch] = useState('');
    const [selectedCarModel, setSelectedCarModel] = useState(null);

    // store fetched car trims and user selections
    const [carTrims, setCarTrims] = useState({ ...EMPTY_CAR_DETAILS });
    const [carTrimsDropdownOpen, setCarTrimsDropdownOpen] = useState(false);
    const [carTrimsSearch, setCarTrimsSearch] = useState('');
    const [selectedCarTrim, setSelectedCarTrim] = useState(null);
    
    // store user selections of car exterior color
    const [selectedCarExteriorColor, setSelectedCarExteriorColor] = useState(null);

    // store user selections of car interior color
    const [selectedCarInteriorColor, setSelectedCarInteriorColor] = useState(null);

    // store user selections of detailing type
    const [detailingTypesDropdownOpen, setDetailingTypesDropdownOpen] = useState(false);
    const [selectedDetailingType, setSelectedDetailingType] = useState(null);

    // function takes a car detail ID and finds it in the detail's data list
    const setSelectedDataFromId = (data, setSelected) => async (id) => {
        // if ID is callback, get value of function
        if (typeof id === 'function') {
            id = id();
        }
        // if ID is null, set remove selection
        if (id == null) {
            setSelected(null);
            return;
        }
        // set selection to data with given ID
        setSelected(data.find(detail => detail.id === id));
    };

    // function takes a car trim ID and fetches the trim details from CarAPI
    const setSelectedCarTrimFromId = async (id) => {
        // if ID is callback, get value of function
        if (typeof id === 'function') {
            id = id();
        }
        // if ID is null, set remove selection
        if (id == null) {
            setSelectedCarTrim(null);
            return;
        }
        const url = new URL(`${CAR_API_TRIMS_URL}/${id}`, CAR_API_BASE_URL);
        try {
            const trimResponse = await fetch(url.toString());
            if (trimResponse.ok) {
                const trim = await trimResponse.json();
                setSelectedCarTrim(trim);
            } else {
                console.error('Something went wrong', trimResponse);
            }
        } catch (e) {
            console.error(e);
        }
    }

    // create objects for each group of states so that easy to pass around
    const carMakesData = {
        id: 1,
        schema: {
            label: 'name',
            value: 'id',
        },
        data: carMakes.data,
        next: carMakes.next,
        setDetails: setCarMakes,
        isDropdownOpen: carMakesDropdownOpen,
        setIsDropdownOpen: setCarMakesDropdownOpen,
        search: carMakesSearch,
        setSearch: setCarMakesSearch,
        selected: selectedCarMake,
        setSelected: setSelectedDataFromId(carMakes.data, setSelectedCarMake),
    };
    const carModelsData = {
        id: 2,
        schema: {
            label: 'name',
            value: 'id',
        },
        data: carModels.data,
        next: carModels.next,
        setDetails: setCarModels,
        isDropdownOpen: carModelsDropdownOpen,
        setIsDropdownOpen: setCarModelsDropdownOpen,
        search: carModelsSearch,
        setSearch: setCarModelsSearch,
        selected: selectedCarModel,
        setSelected: setSelectedDataFromId(carModels.data, setSelectedCarModel),
    };
    const carTrimsData = {
        id: 3,
        schema: {
            label: 'description',
            value: 'id',
        },
        data: carTrims.data,
        next: carTrims.next,
        setDetails: setCarTrims,
        isDropdownOpen: carTrimsDropdownOpen,
        setIsDropdownOpen: setCarTrimsDropdownOpen,
        search: carTrimsSearch,
        setSearch: setCarTrimsSearch,
        selected: selectedCarTrim,
        setSelected: setSelectedCarTrimFromId,
    };
    const carExteriorColorsData = {
        id: 4,
        data: selectedCarTrim?.exterior_colors ?? [],
        setDetails: () => {},
        selected: selectedCarExteriorColor,
        setSelected: setSelectedCarExteriorColor,
    };
    const carInteriorColorsData = {
        id: 5,
        data: selectedCarTrim?.interior_colors ?? [],
        setDetails: () => {},
        selected: selectedCarInteriorColor,
        setSelected: setSelectedCarInteriorColor,
    };
    const detailingTypesData = {
        id: 6,
        schema: {
            label: 'name',
            value: 'id',
        },
        data: detailingTypes,
        isDropdownOpen: detailingTypesDropdownOpen,
        setIsDropdownOpen: setDetailingTypesDropdownOpen,
        selected: selectedDetailingType,
        setSelected: setSelectedDataFromId(detailingTypes, setSelectedDetailingType),
    };

    // holds all dropdowns on the form, in order to ensure only one open at a time
    const carFormDropdowns = [carMakesData, carModelsData, carTrimsData, detailingTypesData];
    
    // set hierarchal relationships between values
    carMakesData.dependentData = [carModelsData, carTrimsData, carExteriorColorsData, carInteriorColorsData];
    carModelsData.dependentData = [carTrimsData, carExteriorColorsData, carInteriorColorsData];
    carTrimsData.dependentData = [carExteriorColorsData, carInteriorColorsData];

    // calculate the estimated cost, if there is enough user input to do so
    const estimatedCost = (selectedCarTrim != null && selectedDetailingType != null)
        ? calculateEstimatedCost(selectedCarTrim.bodies?.[0] ?? { }, selectedDetailingType)
        : null;

    // function gets the first page from CarAPI using the given URL, storing the data to the given state setter
    const getFirstPageFromCarAPIAsync = async (urlPath, searchParams, setCarDetails, selectedCarDetail) => {
        // construct URL
        const url = new URL(urlPath, CAR_API_BASE_URL);
        url.search = searchParams.toString();
        // get first page of car details from API, set state
        try {
            const carAPIResponse = await fetch(url.toString());
            if (carAPIResponse.ok) {
                const carDetails = await carAPIResponse.json();
                setCarDetails(prevDetails => {
                    // if previous details contains selected detail and current doesn't, add selected detail to start of list
                    const prevSelectedDetail = prevDetails.data.find(detail => detail.id === selectedCarDetail?.id);
                    const currSelectedDetail = carDetails.data.find(detail => detail.id === selectedCarDetail?.id);
                    if (prevSelectedDetail != null && currSelectedDetail == null) {
                        carDetails.data.unshift(prevSelectedDetail);
                    }
                    return {
                        data: carDetails.data,
                        next: carDetails.collection.next,
                    };
                });
                
            } else {
                console.error('Something went wrong:', carAPIResponse);
            }

        } catch (e) {
            console.error(e);
        }
    }

    // function gets the next page from CarAPI using the given URL, appending the data to the given state setter
    const getNextPageFromCarAPIAsync = async (urlPath, setCarDetails) => {
        if (urlPath.length === 0) return; // if no next page, do nothing
        const url = new URL(urlPath, CAR_API_BASE_URL); // construct URL
        // get next page of car details from API, append newly fetched items to existing data
        try {
            const carAPIResponse = await fetch(url.toString());
            if (carAPIResponse.ok) {
                const carDetails = await carAPIResponse.json();
                setCarDetails(prevDetails => {
                    // only if the new detail is not already in the list, append it
                    for (const detail of carDetails.data) {
                        if (!prevDetails.data.some(d => d.id === detail.id)) {
                            prevDetails.data.push(detail);
                        }
                    }
                    return {
                        data: prevDetails.data,
                        next: carDetails.collection.next,
                    };
                });
                
            } else {
                console.error('Something went wrong:', carAPIResponse);
            }

        } catch (e) {
            console.error(e);
        }
    }

    // handles car make dropdown changing on search filtering
    useEffect(() => {
        // create URL search params for API call to CarAPI endpoint
        const searchParams = new URLSearchParams();
        searchParams.set('limit', API_RESULT_LIMIT);
        searchParams.set('make', carMakesSearch);
        // get first page of car makes from CarAPI
        getFirstPageFromCarAPIAsync(CAR_API_MAKES_URL, searchParams, setCarMakes, selectedCarMake);
    }, [carMakesSearch]);

    // handle car model dropdown changing on search filtering or change car make
    useEffect(() => {
        // if no car make selected, do not allow select model
        if (selectedCarMake == null) return;
        // create URL search params for API call to CarAPI endpoint
        const searchParams = new URLSearchParams();
        searchParams.set('limit', API_RESULT_LIMIT);
        searchParams.set('make_id', selectedCarMake.id);
        // use like operator to search for models starting with specified search
        searchParams.set('json', JSON.stringify([{ field: 'model', 'op': 'like', 'val': `${carModelsSearch}%` }]));
        // get first page of car models from CarAPI
        getFirstPageFromCarAPIAsync(CAR_API_MODELS_URL, searchParams, setCarModels, selectedCarModel);
    }, [selectedCarMake, carModelsSearch]);

    // handle car trim dropdown changing on search filtering or change car make
    useEffect(() => {
        // if no car make or model selected, do not allow select trim
        if (selectedCarMake == null || selectedCarModel == null) return;
        // create URL for API call to CarAPI endpoint
        const searchParams = new URLSearchParams();
        searchParams.set('limit', API_RESULT_LIMIT);
        searchParams.set('make_id', selectedCarMake.id);
        searchParams.set('model_id', selectedCarModel.id);
        // use like operator to search for trims containing specified search
        searchParams.set('json', JSON.stringify([{ field: 'description', 'op': 'like', 'val': `%${carTrimsSearch}%` }]));
        // get first page of car trims from CarAPI
        getFirstPageFromCarAPIAsync(CAR_API_TRIMS_URL, searchParams, setCarTrims, selectedCarTrim);
    }, [selectedCarMake, selectedCarModel, carTrimsSearch]);

    // when dropdown with given ID opened, close other dropdowns
    const handleOpenDropdown = (id) => () => {
        // close all other dropdowns that is not this dropdown
        for (const detailsData of carFormDropdowns) {
            if (detailsData.id !== id) {
                detailsData.setIsDropdownOpen(false);
            }
        }
    }

    // render the detailing type dropdown
    const renderDetailingTypeDropdownPicker = (detailingTypesData, label) => {
        return (
            <View>
                <Text style={carDetailsFormStyles.label}>
                    {label}
                </Text>
                {detailingTypesData.selected != null && (
                    <Text>
                        {detailingTypesData.selected?.description}
                    </Text>
                )}
                <DropDownPicker
                    schema={detailingTypesData.schema}
                    listMode="SCROLLVIEW"
                    open={detailingTypesData.isDropdownOpen}
                    items={detailingTypesData.data}
                    value={detailingTypesData.selected?.id}
                    placeholder="None selected"
                    setOpen={detailingTypesData.setIsDropdownOpen}
                    setValue={detailingTypesData.setSelected}
                    onOpen={handleOpenDropdown(detailingTypesData.id)}
                    zIndex={10000}
                />
            </View>
        );
    };

    // render the car details dropdown, which contains search functionality and lazy loading
    const renderCarDetailsDropdownPicker = (carDetailsData, label) => {
        // when data changes, reset search and all dependent data to reflect changes
        const handleChange = () => {
            carDetailsData.setSearch(''); // reset search
            // for each dependent data, reset details and user selections
            carDetailsData.dependentData?.forEach(dependentData => {
                dependentData.setDetails({ ...EMPTY_CAR_DETAILS });
                dependentData.setSelected(null);
            });
        }

        // when reach end of dropdown, load more data if is more to load
        const handleLoadMore = () => {
            getNextPageFromCarAPIAsync(carDetailsData.next, carDetailsData.setDetails);
        }

        // only add activity indicator to bottom of dropdown if there are more items to load
        const getDropdownLoadingMoreIndicator = () => {
            if (carDetailsData.next.length > 0) {
                return <ActivityIndicator />;
            }
        }

        // if any item selected, add clear selection option to start of dropdown
        const items = [...carDetailsData.data];
        if (carDetailsData.selected != null) {
            items.unshift({
                [carDetailsData.schema.label]: 'Clear selection',
                [carDetailsData.schema.value]: null,
            });
        };

        return (
            <View>
                <Text style={carDetailsFormStyles.label}>
                    {label}
                </Text>
                <DropDownPicker
                    schema={carDetailsData.schema}
                    listMode="MODAL"
                    open={carDetailsData.isDropdownOpen}
                    items={items}
                    value={carDetailsData.selected?.id}
                    placeholder="None selected"
                    searchable={true}
                    disableLocalSearch={true}
                    searchPlaceholder="Search..."
                    setOpen={carDetailsData.setIsDropdownOpen}
                    setValue={carDetailsData.setSelected}
                    onChangeSearchText={carDetailsData.setSearch}
                    onOpen={handleOpenDropdown(carDetailsData.id)}
                    onSelectItem={handleChange}
                    flatListProps={{
                        onEndReached: handleLoadMore,
                        onEndReachedThreshold: 0.5,
                        ListFooterComponent: getDropdownLoadingMoreIndicator,
                    }}
                />
            </View>
        );
    }

    // render the car color palette picker, which shows all the colors in a horizontal flat list
    const renderCarColorPalettePicker = (carColorsData, label) => {
        // handle selecting or deselecting color palette
        const handleSelect = (item) => () => {
            // if this item is currently selected, deselect
            if (item.id === carColorsData.selected?.id) {
                carColorsData.setSelected(null);
            // otherwise, select this item
            } else {
                carColorsData.setSelected(item);
            }
        }
        
        return (
            <View>
                <Text style={carDetailsFormStyles.label}>
                    {label}
                </Text>
                <Text>
                    {carColorsData.selected?.name ?? 'None selected'}
                </Text>
                <FlatList
                    data={carColorsData.data}
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={handleSelect(item)}
                        >
                            <View
                                style={[
                                    carDetailsFormStyles.colorPalette,
                                    { backgroundColor: `rgb(${item.rgb})` },
                                    carColorsData.selected?.id === item.id && carDetailsFormStyles.selectedColorPalette,
                                ]}
                            />
                        </Pressable>
                    )}
                    horizontal={true}
                />
            </View>
        );
    }

    // render a simple text field with a label
    const renderFieldText = (text, label) => {
        return (
            <View>
                <Text style={carDetailsFormStyles.label}>
                    {label}
                </Text>
                <Text>{text}</Text>
            </View>
        );
    };

    return (
        <SafeAreaProvider>
            <SafeAreaView style={carDetailsFormStyles.container}>
                <ScrollView contentContainerStyle={carDetailsFormStyles.carFormContainer}>
                    <View style={carDetailsFormStyles.notice}>
                        <Text style={carDetailsFormStyles.noticeIcon}>i</Text>
                        <Text style={carDetailsFormStyles.noticeText}>
                            Don't worry if you aren't sure about something that is asked here, you may leave
                            it blank or input an answer you think may be correct. This is only to help you get
                            a cost estimate and for us to get a rough understanding about your car.
                        </Text>
                        <Text style={carDetailsFormStyles.noticeText}>
                            Note - the costs are only an estimation, and may go up or down. We can discuss
                            one on one to negotiate prices.
                        </Text>
                    </View>
                    {renderDetailingTypeDropdownPicker(detailingTypesData, 'Detailing Type')}
                    {renderCarDetailsDropdownPicker(carMakesData, 'Car Make')}
                    {selectedCarMake != null &&
                        renderCarDetailsDropdownPicker(carModelsData, 'Car Model')}
                    {selectedCarModel != null &&
                        renderCarDetailsDropdownPicker(carTrimsData, 'Car Trim')}
                    {selectedCarTrim != null &&
                        renderCarColorPalettePicker(carExteriorColorsData, 'Exterior Color')}
                    {selectedCarTrim != null &&
                        renderCarColorPalettePicker(carInteriorColorsData, 'Interior Color')}
                    {estimatedCost != null &&
                        renderFieldText(formatterCAD.format(estimatedCost), 'Estimated Cost')}
                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const carDetailsFormStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    carFormContainer: {
        margin: 20,
        gap: 20,
        paddingBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: 700,
        marginBottom: 5,
    },
    notice: {
        backgroundColor: '#DDE',
        borderColor: '#AAD',
        padding: 10,
        borderRadius: 10,
        borderWidth: 3,
    },
    noticeIcon: {
        backgroundColor: '#AAD',
        color: '#FFF',
        width: 30,
        height: 30,
        borderRadius: 15,
        textAlign: 'center',
        fontSize: 20,
        lineHeight: 30,
        fontWeight: 900,
        marginInline: 'auto',
    },
    noticeText: {
        color: '#55A',
        marginTop: 5,
    },
    colorPalette: {
        width: 50,
        height: 50,
        margin: 5,
        borderWidth: 2,
        borderColor: '#333',
    },
    selectedColorPalette: {
        outlineColor: '#AAD',
        outlineWidth: 5,
        borderColor: '#DDD',
        borderWidth: 2,
    },
  });