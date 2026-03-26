import { useState, useEffect } from 'react';
import { View, ScrollView, Text, ActivityIndicator, FlatList, Pressable, StyleSheet, BackHandler } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ErrorScreen from '../ErrorScreen';

import { db } from '../../firebaseConfig';
import { doc, collection, query, updateDoc, onSnapshot, where } from 'firebase/firestore';

import LoadingScreen from '../LoadingScreen';
import CustomerRequestStepIndicator from './CustomerRequestStepIndicator';

import { formatterCAD } from '../../utils';
import styles from '../../stylesheet';


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
const calculateEstimatedCost = (detailingType, car) => {
    const estimatedSurfaceArea = estimateSurfaceAreaOfCar_In2(car);
    const numberOfSeats = car.seats ?? CAR_SEATS_AVG;
    const numberOfDoors = car.doors ?? CAR_DOORS_AVG;
    const costRaw = detailingType.baseCost
         + (detailingType.additionalCostPerSquareInch ?? 0) * estimatedSurfaceArea
         + (detailingType.additionalCostPerSeat ?? 0) * numberOfSeats
         + (detailingType.additionalCostPerDoor ?? 0) * numberOfDoors;
    return roundToNearestMultipleOf(costRaw, DETAILING_COST_MULTIPLE);
}

export default function CarDetailsFormScreen({ route }) {
    const navigation = useNavigation();

    // load until finish fetching data
    const [loading, setLoading] = useState(true);

    // stores the request that was created in the previous step of the customer request
    const [request, setRequest] = useState(null);
    // stores the detailing type of the selected request
    const [detailingType, setDetailingType] = useState(null);

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
    const [selectedCarTrimDetails, setSelectedCarTrimDetails] = useState(null);
    
    // store user selections of car exterior color
    const [selectedCarExteriorColor, setSelectedCarExteriorColor] = useState(null);

    // store user selections of car interior color
    const [selectedCarInteriorColor, setSelectedCarInteriorColor] = useState(null);

    // create objects for each group of states so that easy to pass around
    const carMakesData = {
        id: 1,
        valueName: 'name',
        data: carMakes.data,
        next: carMakes.next,
        setDetails: setCarMakes,
        isDropdownOpen: carMakesDropdownOpen,
        setIsDropdownOpen: setCarMakesDropdownOpen,
        search: carMakesSearch,
        setSearch: setCarMakesSearch,
        selected: selectedCarMake,
        setSelected: setSelectedCarMake,
    };
    const carModelsData = {
        id: 2,
        valueName: 'name',
        data: carModels.data,
        next: carModels.next,
        setDetails: setCarModels,
        isDropdownOpen: carModelsDropdownOpen,
        setIsDropdownOpen: setCarModelsDropdownOpen,
        search: carModelsSearch,
        setSearch: setCarModelsSearch,
        selected: selectedCarModel,
        setSelected: setSelectedCarModel,
    };
    const carTrimsData = {
        id: 3,
        valueName: 'description',
        data: carTrims.data,
        next: carTrims.next,
        setDetails: setCarTrims,
        isDropdownOpen: carTrimsDropdownOpen,
        setIsDropdownOpen: setCarTrimsDropdownOpen,
        search: carTrimsSearch,
        setSearch: setCarTrimsSearch,
        selected: selectedCarTrim,
        setSelected: setSelectedCarTrim,
    };
    const carExteriorColorsData = {
        id: 4,
        data: selectedCarTrimDetails?.exterior_colors ?? [],
        setDetails: () => {},
        selected: selectedCarExteriorColor,
        setSelected: setSelectedCarExteriorColor,
    };
    const carInteriorColorsData = {
        id: 5,
        data: selectedCarTrimDetails?.interior_colors ?? [],
        setDetails: () => {},
        selected: selectedCarInteriorColor,
        setSelected: setSelectedCarInteriorColor,
    };

    // holds all dropdowns on the form, in order to ensure only one open at a time
    const carFormDropdowns = [carMakesData, carModelsData, carTrimsData];
    
    // set hierarchal relationships between values
    carMakesData.dependentData = [carModelsData, carTrimsData, carExteriorColorsData, carInteriorColorsData];
    carModelsData.dependentData = [carTrimsData, carExteriorColorsData, carInteriorColorsData];
    carTrimsData.dependentData = [carExteriorColorsData, carInteriorColorsData];

    // calculate the estimated cost, if there is enough user input to do so
    const estimatedCost = (detailingType != null && selectedCarTrimDetails != null)
        ? calculateEstimatedCost(detailingType, selectedCarTrimDetails.bodies?.[0] ?? { })
        : null;

    // handles getting the request from the database
    useEffect(() => {
        if (route.params?.requestId == null) return; // if request not passed in navigation, cannot continue
        const { requestId } = route.params;
        const requestDoc = doc(db, 'requests', requestId);
        // listen for changes
        const unsubscribe = onSnapshot(requestDoc, async (requestDocSnapshot) => {
            // store request in state, or null if doesn't exist
            if (requestDocSnapshot.exists()) {
                const request = { ...requestDocSnapshot.data(), id: requestDocSnapshot.id };
                setRequest(request);
                // set form values based on existing values
                if (request.carMake) setSelectedCarMake(request.carMake);
                if (request.carModel) setSelectedCarModel(request.carModel);
                if (request.carTrim) setSelectedCarTrim(request.carTrim);
                if (request.carExteriorColor) setSelectedCarExteriorColor(
                    { name: request.carExteriorColor, rgb: request.carExteriorColorRgb });
                if (request.carInteriorColor) setSelectedCarInteriorColor(
                    { name: request.carInteriorColor, rgb: request.carInteriorColorRgb }); 
            } else {
                setRequest(null);
            }
        });
        return unsubscribe;
    }, []);

    // handles getting the details of the selected detailing type
    useEffect(() => {
        setLoading(true); // begin loading

        // if no request, reset detailing type
        if (request == null) {
            setDetailingType(null);
            return;
        }

        const detailingTypeQuery = query(
            collection(db, 'detailingTypes'),
            where('name', '==', request.serviceType)
        );
        const unsubscribe = onSnapshot(detailingTypeQuery, (detailingTypeSnapshot) => {
            // set the detailing type to the data, if exists
            if (detailingTypeSnapshot.docs.length > 0) {
                const detailingTypeData = detailingTypeSnapshot.docs[0];
                const detailingType = { ...detailingTypeData.data(), id: detailingTypeData.id };
                setDetailingType(detailingType);
                setLoading(false); // finish loading
            } else {
                setDetailingType(null);
            }
        });
        return unsubscribe;
    }, [request]);

    // function gets the first page from CarAPI using the given URL, storing the data to the given state setter
    const getFirstPageFromCarAPIAsync = async (urlPath, searchParams, setCarDetails, selectedCarDetail, valueName) => {
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
                    const prevSelectedDetail = prevDetails.data.find(detail => detail[valueName] === selectedCarDetail);
                    const currSelectedDetail = carDetails.data.find(detail => detail[valueName] === selectedCarDetail);
                    if (prevSelectedDetail != null && currSelectedDetail == null) {
                        carDetails.data.unshift(prevSelectedDetail);
                    }
                    carDetails.data = carDetails.data.filter(({ [valueName]: val1 }, i, arr) => // remove duplicate value names
                        arr.findIndex(({ [valueName]: val2 }) => val2 === val1) === i);
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
    const getNextPageFromCarAPIAsync = async (urlPath, setCarDetails, valueName) => {
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
                        if (!prevDetails.data.some(d => d[valueName] === detail[valueName])) {
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
        getFirstPageFromCarAPIAsync(CAR_API_MAKES_URL, searchParams, setCarMakes, selectedCarMake, carMakesData.valueName);
    }, [carMakesSearch]);

    // handle car model dropdown changing on search filtering or change car make
    useEffect(() => {
        // if no car make selected, do not allow select model
        if (selectedCarMake == null) return;
        // create URL search params for API call to CarAPI endpoint
        const searchParams = new URLSearchParams();
        searchParams.set('limit', API_RESULT_LIMIT);
        searchParams.set('make', selectedCarMake);
        // use like operator to search for models starting with specified search
        searchParams.set('json', JSON.stringify([{ field: 'model', 'op': 'like', 'val': `${carModelsSearch}%` }]));
        // get first page of car models from CarAPI
        getFirstPageFromCarAPIAsync(CAR_API_MODELS_URL, searchParams, setCarModels, selectedCarModel, carModelsData.valueName);
    }, [selectedCarMake, carModelsSearch]);

    // handle car trim dropdown changing on search filtering or change car make
    useEffect(() => {
        // if no car make or model selected, do not allow select trim
        if (selectedCarMake == null || selectedCarModel == null) return;
        // create URL for API call to CarAPI endpoint
        const searchParams = new URLSearchParams();
        searchParams.set('limit', API_RESULT_LIMIT);
        searchParams.set('make', selectedCarMake);
        searchParams.set('model', selectedCarModel);
        // use like operator to search for trims containing specified search
        searchParams.set('json', JSON.stringify([{ field: 'description', 'op': 'like', 'val': `%${carTrimsSearch}%` }]));
        // get first page of car trims from CarAPI
        getFirstPageFromCarAPIAsync(CAR_API_TRIMS_URL, searchParams, setCarTrims, selectedCarTrim, carTrimsData.valueName);
    }, [selectedCarMake, selectedCarModel, carTrimsSearch]);

    // handle getting the car details when the car trim has been selected
    useEffect(() => {
        // wait until trims data dropdown exists and option selected
        if (carTrims == null || selectedCarTrim == null) {
            setSelectedCarTrimDetails(null);
            return;
        }

        // get ID of trim from dropdown, halting if for some reason not found
        const selectedCarTrimId = carTrims.data.find(detail => detail[carTrimsData.valueName] === selectedCarTrim)?.id;
        if (selectedCarTrimId == null) {
            setSelectedCarTrimDetails(null);
            return;
        }

        // send a request for the trim details
        (async () => {
            const url = new URL(`${CAR_API_TRIMS_URL}/${selectedCarTrimId}`, CAR_API_BASE_URL);
            try {
                const trimResponse = await fetch(url.toString());
                if (trimResponse.ok) {
                    const trimDetails = await trimResponse.json();
                    setSelectedCarTrimDetails(trimDetails);
                } else {
                    console.error('Something went wrong', trimResponse);
                }
            } catch (e) {
                console.error(e);
            }
        })();

    }, [carTrims, selectedCarTrim])

    // handle saving the selections to the request on submit
    const submit = async () => {
        const requestDoc = doc(db, 'requests', request.id);
        try {
            await updateDoc(requestDoc, {
                carMake: selectedCarMake ?? null,
                carModel: selectedCarModel ?? null,
                carTrim: selectedCarTrim ?? null,
                carExteriorColor: selectedCarExteriorColor?.name ?? null,
                carExteriorColorRgb: selectedCarExteriorColor?.rgb ?? null,
                carInteriorColor: selectedCarInteriorColor?.name ?? null,
                carInteriorColorRgb: selectedCarInteriorColor?.rgb ?? null,
                estimatedCost: estimatedCost ?? null,
            });
            navigation.navigate('ConfirmRequest', { requestId: request.id }); // last step, so confirm request
        } catch (e) {
            console.error(e);
        }
    }

    // when dropdown with given ID opened, close other dropdowns
    const handleOpenDropdown = (id) => () => {
        // close all other dropdowns that is not this dropdown
        for (const detailsData of carFormDropdowns) {
            if (detailsData.id !== id) {
                detailsData.setIsDropdownOpen(false);
            }
        }
    }

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
            getNextPageFromCarAPIAsync(carDetailsData.next, carDetailsData.setDetails, carDetailsData.valueName);
        }

        // only add activity indicator to bottom of dropdown if there are more items to load
        const getDropdownLoadingMoreIndicator = () => {
            if (carDetailsData.next.length > 0) {
                return <ActivityIndicator />;
            }
        }

        // if any item selected, add clear selection option to start of dropdown
        const items = carDetailsData.data.map(data => ({ ...data, label: data[carDetailsData.valueName] }));
        if (carDetailsData.selected != null) {
            items.unshift({
                [carDetailsData.valueName]: null,
                label: 'Clear selection',
            });
        };

        return (
            <View>
                <Text style={styles.inputLabel}>
                    {label}
                </Text>
                <DropDownPicker
                    schema={{
                        label: 'label',
                        value: carDetailsData.valueName,
                    }}
                    listMode="MODAL"
                    open={carDetailsData.isDropdownOpen}
                    items={items}
                    value={carDetailsData.selected}
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
            if (item.name === carColorsData.selected?.name) {
                carColorsData.setSelected(null);
            // otherwise, select this item
            } else {
                carColorsData.setSelected(item);
            }
        }
        
        return (
            <View>
                <Text style={styles.inputLabel}>
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
                                    carColorsData.selected?.name === item.name && carDetailsFormStyles.selectedColorPalette,
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
                <Text style={styles.inputLabel}>
                    {label}
                </Text>
                <Text>{text}</Text>
            </View>
        );
    };

    // show loading screen until finished fetching
    if (loading) {
        return <LoadingScreen />
    }

    // if no request passed in, cannot save selection so return error screen
    if (request == null) {
        return <ErrorScreen errorMessage="Unknown Request" />
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={carDetailsFormStyles.container}>
                <ScrollView contentContainerStyle={carDetailsFormStyles.carFormContainer}>
                    <CustomerRequestStepIndicator currentStep={2} />
                    <View>
                        <Text style={styles.inputLabel}>Selected Service Type</Text>
                        <Text>{request.serviceType}</Text>
                    </View>
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
                    {renderCarDetailsDropdownPicker(carMakesData, 'Car Make')}
                    {selectedCarMake != null &&
                        renderCarDetailsDropdownPicker(carModelsData, 'Car Model')}
                    {selectedCarModel != null &&
                        renderCarDetailsDropdownPicker(carTrimsData, 'Car Trim')}
                    {selectedCarTrimDetails != null &&
                        renderCarColorPalettePicker(carExteriorColorsData, 'Exterior Color')}
                    {selectedCarTrimDetails != null &&
                        renderCarColorPalettePicker(carInteriorColorsData, 'Interior Color')}
                    {estimatedCost != null &&
                        renderFieldText(formatterCAD.format(estimatedCost), 'Estimated Cost')}

                    <Pressable onPress={submit} style={{ ...styles.button, ...styles.buttonPlain }}>
                        <Text style={styles.buttonText}>Submit</Text>
                    </Pressable>
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