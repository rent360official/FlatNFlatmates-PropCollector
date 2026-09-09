'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Building,
  MapPin,
  IndianRupee,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  Image as ImageIcon,
  Compass,
  Check,
  Search,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Save,
  ShieldCheck,
  HelpCircle,
  Star,
  Layers,
  Wand2,
  Video as VideoIcon,
  Film,
  Play,
  UploadCloud,
} from 'lucide-react';
import MapLocationPicker from '@/components/MapLocationPicker';

interface PropertyFormProps {
  initialData?: any;
  isEditMode?: boolean;
}

const TABS = [
  { id: 'owner', label: '1. Owner Info', icon: User },
  { id: 'specs', label: '2. Basic Specs', icon: Building },
  { id: 'location', label: '3. Location', icon: MapPin },
  { id: 'pricing', label: '4. Pricing & Lease', icon: IndianRupee },
  { id: 'amenities', label: '5. Amenities & Rules', icon: Layers },
  { id: 'media', label: '6. Photos & Media', icon: ImageIcon },
  { id: 'review', label: '7. Review & Save', icon: CheckCircle2 },
];

const POPULAR_AMENITIES = [
  'WiFi',
  'Air Conditioner',
  'Refrigerator',
  'Washing Machine',
  'Geyser',
  'Television',
  'Lift',
  'Power Backup',
  'Gym',
  'Swimming Pool',
  'Covered Parking',
  'Security Guard',
  'CCTV',
  'Balcony',
  'Modular Kitchen',
  'Water Purifier',
  'Microwave',
  'Sofa',
  'Dining Table',
  'Gas Pipeline',
];

const POPULAR_RULES = [
  'No Smoking inside',
  'No Loud Music after 10 PM',
  'Pets Allowed',
  'Visitors Allowed',
  'Veg Cooking Only',
  'Gate closes at 11 PM',
];

const POPULAR_SAFETY = [
  'Gated Community',
  '24/7 Security Guard',
  'CCTV Surveillance',
  'Fire Extinguisher',
  'Biometric / Keycard Access',
  'Intercom Facility',
];

export default function PropertyForm({ initialData, isEditMode = false }: PropertyFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('owner');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Cities and Localities
  const [cities, setCities] = useState<any[]>([]);
  const [localities, setLocalities] = useState<any[]>([]);
  const [fetchingLocalities, setFetchingLocalities] = useState(false);

  // Owner selection state
  const [ownerMode, setOwnerMode] = useState<'select' | 'new'>(
    initialData?.ownerId ? 'select' : 'new'
  );
  const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<any>(
    initialData?.ownerId ? initialData.ownerId : null
  );

  // New Owner fields (Only phone is mandatory)
  const [newOwner, setNewOwner] = useState({
    phone: '',
    name: '',
    email: '',
    gender: 'male',
    age: '',
    profession: '',
    bio: '',
  });

  // Property Details State
  const [formData, setFormData] = useState<any>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    propertyType: initialData?.propertyType || 'apartment',
    bhkConfig: initialData?.bhkConfig || '2BHK',
    furnishingStatus: initialData?.furnishingStatus || 'semi_furnished',
    tenantPreference: initialData?.tenantPreference || 'any',
    managementType: initialData?.managementType || 'self_managed',
    floor: initialData?.floor ?? '',
    totalFloors: initialData?.totalFloors ?? '',
    areaSqft: initialData?.areaSqft ?? '',

    // Location
    cityId: initialData?.cityId?._id || initialData?.cityId || '',
    localityId: initialData?.localityId?._id || initialData?.localityId || '',
    addressLine: initialData?.addressLine || '',
    lng: initialData?.location?.coordinates?.[0] ?? '',
    lat: initialData?.location?.coordinates?.[1] ?? '',
    googleMapPlaceId: initialData?.googleMapPlaceId || '',

    // Pricing & Lease
    rentAmount: initialData?.rentAmount ?? '',
    depositAmount: initialData?.depositAmount ?? '',
    maintenanceAmount: initialData?.maintenanceAmount ?? 0,
    brokerageFlag: initialData?.brokerageFlag ?? false,
    brokerageAmount: initialData?.brokerageAmount ?? 0,
    availableFrom: initialData?.availableFrom
      ? new Date(initialData.availableFrom).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    minLeaseMonths: initialData?.minLeaseMonths ?? 11,
    lockInMonths: initialData?.lockInMonths ?? 0,

    // Amenities & Rules
    amenities: initialData?.amenities || [],
    houseRules: initialData?.houseRules || [],
    safetyFeatures: initialData?.safetyFeatures || [],
    powerBackup: initialData?.powerBackup || 'none',
    waterSupplyType: initialData?.waterSupplyType || 'municipal',
    parkingType: initialData?.parkingType || 'two_wheeler',
    evChargingAvailable: initialData?.evChargingAvailable ?? false,
    petPolicy: initialData?.petPolicy || 'case_by_case',
    maxOccupants: initialData?.maxOccupants ?? 2,
    fiberAvailable: initialData?.internetReadiness?.fiberAvailable ?? false,
    avgSpeedMbps: initialData?.internetReadiness?.avgSpeedMbps ?? '',
    allowWhatsappContact: initialData?.allowWhatsappContact ?? true,

    // Media
    images: initialData?.images || [],
    videos: initialData?.videos || [],
    tourVideoUrl: initialData?.tourVideoUrl || '',

    // Status (default: paused)
    status: initialData?.status || 'paused',
  });

  // Custom new amenity/rule inputs
  const [customAmenity, setCustomAmenity] = useState('');
  const [customRule, setCustomRule] = useState('');
  const [customSafety, setCustomSafety] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<{ [key: string]: number }>({});
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Fetch Cities
  useEffect(() => {
    fetch('/api/cities')
      .then((res) => res.json())
      .then((data) => {
        if (data.cities) {
          setCities(data.cities);
          if (!formData.cityId && data.cities.length > 0) {
            setFormData((prev: any) => ({ ...prev, cityId: data.cities[0]._id }));
          }
        }
      })
      .catch((err) => console.error('Error fetching cities:', err));
  }, []);

  // Fetch Localities when cityId changes
  useEffect(() => {
    if (!formData.cityId) {
      setLocalities([]);
      return;
    }
    setFetchingLocalities(true);
    fetch(`/api/localities?cityId=${formData.cityId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.localities) {
          setLocalities(data.localities);
          // If no locality selected or current not in list, auto select first
          if (!formData.localityId && data.localities.length > 0) {
            setFormData((prev: any) => ({ ...prev, localityId: data.localities[0]._id }));
          }
        }
      })
      .catch((err) => console.error('Error fetching localities:', err))
      .finally(() => setFetchingLocalities(false));
  }, [formData.cityId]);

  // Debounced search for owners
  useEffect(() => {
    if (ownerMode !== 'select') return;
    const timer = setTimeout(() => {
      setSearchingUsers(true);
      fetch(`/api/users/search?q=${encodeURIComponent(ownerSearchQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          setUserSearchResults(data.users || []);
        })
        .catch((err) => console.error('User search error:', err))
        .finally(() => setSearchingUsers(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [ownerSearchQuery, ownerMode]);

  // Draft Auto-Save in LocalStorage (only in create mode)
  useEffect(() => {
    if (!isEditMode) {
      const savedDraft = localStorage.getItem('fnf_property_collector_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.formData && !formData.title) {
            setFormData(parsed.formData);
            if (parsed.newOwner) setNewOwner(parsed.newOwner);
          }
        } catch (e) {}
      }
    }
  }, []);

  const saveDraftToLocalStorage = (newForm: any, newOwn: any) => {
    if (!isEditMode && typeof window !== 'undefined') {
      localStorage.setItem(
        'fnf_property_collector_draft',
        JSON.stringify({ formData: newForm, newOwner: newOwn, savedAt: new Date() })
      );
    }
  };

  const handleFormChange = (key: string, value: any) => {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    saveDraftToLocalStorage(updated, newOwner);
  };

  const handleNewOwnerChange = (key: string, value: any) => {
    const updated = { ...newOwner, [key]: value };
    setNewOwner(updated);
    saveDraftToLocalStorage(formData, updated);
  };

  // GPS Coordinates Fetcher
  const handleFetchGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleFormChange('lat', parseFloat(latitude.toFixed(6)));
        handleFormChange('lng', parseFloat(longitude.toFixed(6)));
        setGpsLoading(false);
      },
      (err) => {
        alert(`Failed to get GPS location: ${err.message}. Please enter manually.`);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Map Location Select Callback from Google Maps picker
  const handleMapLocationSelect = (loc: {
    lat: number;
    lng: number;
    addressLine?: string;
    placeId?: string;
    localityName?: string;
    cityName?: string;
  }) => {
    handleFormChange('lat', loc.lat);
    handleFormChange('lng', loc.lng);
    if (loc.placeId) {
      handleFormChange('googleMapPlaceId', loc.placeId);
    }
    if (loc.addressLine && (!formData.addressLine || formData.addressLine.trim() === '')) {
      handleFormChange('addressLine', loc.addressLine);
    }
    // Match city if recognized
    if (loc.cityName && cities.length > 0) {
      const matchedCity = cities.find(
        (c) => c.name.toLowerCase() === loc.cityName?.toLowerCase()
      );
      if (matchedCity && matchedCity._id !== formData.cityId) {
        handleFormChange('cityId', matchedCity._id);
      }
    }
    // Match locality if recognized
    if (loc.localityName && localities.length > 0) {
      const matchedLoc = localities.find(
        (l) =>
          l.name.toLowerCase().includes(loc.localityName?.toLowerCase() || '') ||
          loc.localityName?.toLowerCase().includes(l.name.toLowerCase())
      );
      if (matchedLoc && matchedLoc._id !== formData.localityId) {
        handleFormChange('localityId', matchedLoc._id);
      }
    }
  };

  // AI / Smart Title & Description Generator Helper
  const handleAutoGenerateContent = () => {
    const selectedCity = cities.find((c) => c._id === formData.cityId)?.name || '';
    const selectedLocality = localities.find((l) => l._id === formData.localityId)?.name || '';
    const furnishText =
      formData.furnishingStatus === 'fully_furnished'
        ? 'Fully Furnished'
        : formData.furnishingStatus === 'semi_furnished'
        ? 'Semi Furnished'
        : 'Unfurnished';

    const genTitle = `${formData.bhkConfig} ${furnishText} ${
      formData.propertyType === 'apartment'
        ? 'Apartment'
        : formData.propertyType === 'villa'
        ? 'Villa'
        : formData.propertyType === 'pg_hostel'
        ? 'PG / Hostel'
        : 'Independent House'
    } in ${selectedLocality || 'Prime Area'}, ${selectedCity || 'City'}`;

    const amenitiesList = formData.amenities?.length > 0 ? formData.amenities.join(', ') : 'Standard modern amenities';
    const genDesc = `Spacious and well-ventilated ${formData.bhkConfig} ${furnishText} ${
      formData.propertyType
    } available for rent in ${formData.addressLine || selectedLocality || 'prime locality'}.\n\nFeatures & Amenities: ${amenitiesList}.\nSuitable for: ${
      formData.tenantPreference.toUpperCase()
    }.\nPower Backup: ${formData.powerBackup.toUpperCase()}, Water Supply: ${formData.waterSupplyType.toUpperCase()}.\nVerified property collected by FlatNFlatmates field team.`;

    handleFormChange('title', genTitle);
    handleFormChange('description', genDesc);
  };

  // Chip Toggle Helpers
  const toggleAmenity = (item: string) => {
    const current = formData.amenities || [];
    const updated = current.includes(item)
      ? current.filter((x: string) => x !== item)
      : [...current, item];
    handleFormChange('amenities', updated);
  };

  const toggleRule = (item: string) => {
    const current = formData.houseRules || [];
    const updated = current.includes(item)
      ? current.filter((x: string) => x !== item)
      : [...current, item];
    handleFormChange('houseRules', updated);
  };

  const toggleSafety = (item: string) => {
    const current = formData.safetyFeatures || [];
    const updated = current.includes(item)
      ? current.filter((x: string) => x !== item)
      : [...current, item];
    handleFormChange('safetyFeatures', updated);
  };

  // Image helpers
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImage(true);
      const fileList = Array.from(files);

      for (const file of fileList) {
        // 1. Get presigned upload URL from S3 API
        const presignRes = await fetch('/api/media/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type || 'image/jpeg',
            mediaType: 'image',
          }),
        });

        if (!presignRes.ok) {
          // If S3 is not configured locally, fallback to local object URL or error message
          const errData = await presignRes.json();
          throw new Error(errData.error || 'Failed to initialize S3 upload');
        }

        const { uploadUrl, publicUrl, rawKey, processedKeys, processedUrls } = await presignRes.json();

        // 2. Direct PUT to S3
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'image/jpeg' },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error(`S3 upload failed for ${file.name}`);
        }

        // 3. Append to property images
        const currentImages = formData.images || [];
        const newImgObj = {
          url: publicUrl,
          rawKey,
          processedKeys,
          processedUrls,
          isCover: currentImages.length === 0,
          fileName: file.name,
          type: 'image',
          status: 'ready',
          order: currentImages.length,
        };

        handleFormChange('images', [...currentImages, newImgObj]);
      }
    } catch (err: any) {
      alert(`Photo upload note: ${err.message}. You can also paste image URLs directly.`);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    const currentImages = formData.images || [];
    const newImgObj = {
      url: newImageUrl.trim(),
      isCover: currentImages.length === 0,
      fileName: `image_${currentImages.length + 1}`,
      type: 'image',
      status: 'ready',
      order: currentImages.length,
    };
    handleFormChange('images', [...currentImages, newImgObj]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = [...(formData.images || [])];
    currentImages.splice(index, 1);
    if (currentImages.length > 0 && !currentImages.some((i) => i.isCover)) {
      currentImages[0].isCover = true;
    }
    handleFormChange('images', currentImages);
  };

  const handleSetCoverImage = (index: number) => {
    const currentImages = (formData.images || []).map((img: any, idx: number) => ({
      ...img,
      isCover: idx === index,
    }));
    handleFormChange('images', currentImages);
  };

  // Video helpers
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingVideo(true);
      const fileList = Array.from(files);
      const newVideos = [...(formData.videos || [])];

      for (const file of fileList) {
        if (file.size > 100 * 1024 * 1024) {
          alert(`File "${file.name}" exceeds maximum allowed size (100MB).`);
          continue;
        }

        const fileId = `${file.name}-${Date.now()}`;
        setVideoUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

        // 1. Request presigned upload URL
        const presignRes = await fetch('/api/media/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type || 'video/mp4',
            mediaType: 'video',
          }),
        });

        if (!presignRes.ok) {
          const errData = await presignRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to initialize S3 video upload');
        }

        const { uploadUrl, publicUrl, rawKey, processedKey, processedUrl, thumbnailKey, thumbnailUrl } =
          await presignRes.json();

        // 2. Direct PUT to S3 with progress
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', uploadUrl, true);
          xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setVideoUploadProgress((prev) => ({ ...prev, [fileId]: percent }));
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 204) {
              resolve();
            } else {
              reject(new Error(`S3 upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Network error during video S3 upload'));
          xhr.send(file);
        });

        // 3. Append to property videos
        const newVidObj = {
          url: publicUrl,
          fileName: file.name,
          sizeBytes: file.size,
          rawKey,
          processedKey,
          processedUrl,
          thumbnailKey,
          thumbnailUrl,
          type: 'video',
          status: 'ready',
        };

        newVideos.push(newVidObj);
        handleFormChange('videos', [...newVideos]);
      }
    } catch (err: any) {
      alert(`Video upload note: ${err.message}. You can also paste video URLs directly.`);
    } finally {
      setUploadingVideo(false);
      setVideoUploadProgress({});
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    }
  };

  const handleAddVideoUrl = () => {
    if (!newVideoUrl.trim()) return;
    const currentVideos = formData.videos || [];
    const newVidObj = {
      url: newVideoUrl.trim(),
      fileName: `video_${currentVideos.length + 1}.mp4`,
      type: 'video',
      status: 'ready',
    };
    handleFormChange('videos', [...currentVideos, newVidObj]);
    setNewVideoUrl('');
  };

  const handleRemoveVideo = (index: number) => {
    const currentVideos = [...(formData.videos || [])];
    currentVideos.splice(index, 1);
    handleFormChange('videos', currentVideos);
  };

  // Validation Check
  const getValidationStatus = () => {
    const errors: { tab: string; field: string }[] = [];

    // Owner validation
    if (ownerMode === 'select' && !selectedOwner?._id) {
      errors.push({ tab: 'owner', field: 'Owner: Please select an existing owner' });
    } else if (ownerMode === 'new' && (!newOwner.phone || !newOwner.phone.trim())) {
      errors.push({ tab: 'owner', field: 'Owner: Phone Number is mandatory' });
    }

    // Specs validation
    if (!formData.title?.trim()) errors.push({ tab: 'specs', field: 'Property Title' });
    if (!formData.bhkConfig) errors.push({ tab: 'specs', field: 'BHK Configuration' });
    if (!formData.propertyType) errors.push({ tab: 'specs', field: 'Property Type' });
    if (!formData.furnishingStatus) errors.push({ tab: 'specs', field: 'Furnishing Status' });
    if (!formData.tenantPreference) errors.push({ tab: 'specs', field: 'Tenant Preference' });

    // Location validation
    if (!formData.cityId) errors.push({ tab: 'location', field: 'City' });
    if (!formData.localityId) errors.push({ tab: 'location', field: 'Locality' });
    if (!formData.addressLine?.trim()) errors.push({ tab: 'location', field: 'Address Line' });
    if (formData.lng === '' || formData.lat === '') {
      errors.push({ tab: 'location', field: 'Map Coordinates (Longitude & Latitude)' });
    }

    // Pricing validation
    if (formData.rentAmount === '' || Number(formData.rentAmount) < 0) {
      errors.push({ tab: 'pricing', field: 'Monthly Rent Amount' });
    }
    if (formData.depositAmount === '' || Number(formData.depositAmount) < 0) {
      errors.push({ tab: 'pricing', field: 'Security Deposit Amount' });
    }

    // Description validation
    if (!formData.description?.trim()) {
      errors.push({ tab: 'review', field: 'Property Description' });
    }

    return errors;
  };

  const validationErrors = getValidationStatus();
  const isValid = validationErrors.length === 0;

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    const errors = getValidationStatus();
    if (errors.length > 0) {
      setSubmitError(`Please complete required fields: ${errors.map((e) => e.field).join(', ')}`);
      // Automatically switch to the first tab that has an error
      setActiveTab(errors[0].tab);
      return;
    }

    try {
      setLoading(true);

      const payload: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        propertyType: formData.propertyType,
        bhkConfig: formData.bhkConfig,
        furnishingStatus: formData.furnishingStatus,
        tenantPreference: formData.tenantPreference,
        managementType: formData.managementType,
        floor: formData.floor !== '' ? Number(formData.floor) : undefined,
        totalFloors: formData.totalFloors !== '' ? Number(formData.totalFloors) : undefined,
        areaSqft: formData.areaSqft !== '' ? Number(formData.areaSqft) : undefined,
        cityId: formData.cityId,
        localityId: formData.localityId,
        addressLine: formData.addressLine.trim(),
        location: {
          type: 'Point',
          coordinates: [Number(formData.lng), Number(formData.lat)],
        },
        googleMapPlaceId: formData.googleMapPlaceId || undefined,
        rentAmount: Number(formData.rentAmount),
        depositAmount: Number(formData.depositAmount),
        maintenanceAmount: Number(formData.maintenanceAmount || 0),
        brokerageFlag: Boolean(formData.brokerageFlag),
        brokerageAmount: Number(formData.brokerageAmount || 0),
        availableFrom: formData.availableFrom,
        minLeaseMonths: Number(formData.minLeaseMonths || 11),
        lockInMonths: Number(formData.lockInMonths || 0),
        amenities: formData.amenities || [],
        houseRules: formData.houseRules || [],
        safetyFeatures: formData.safetyFeatures || [],
        powerBackup: formData.powerBackup,
        waterSupplyType: formData.waterSupplyType,
        parkingType: formData.parkingType,
        evChargingAvailable: Boolean(formData.evChargingAvailable),
        petPolicy: formData.petPolicy,
        maxOccupants: Number(formData.maxOccupants || 2),
        internetReadiness: {
          fiberAvailable: Boolean(formData.fiberAvailable),
          avgSpeedMbps: formData.avgSpeedMbps ? Number(formData.avgSpeedMbps) : undefined,
        },
        allowWhatsappContact: Boolean(formData.allowWhatsappContact),
        images: formData.images || [],
        videos: formData.videos || [],
        tourVideoUrl: formData.tourVideoUrl || undefined,
        status: formData.status || 'paused',
      };

      if (ownerMode === 'select') {
        payload.ownerId = selectedOwner._id;
      } else {
        payload.newOwner = {
          phone: newOwner.phone.trim(),
          name: newOwner.name?.trim() || undefined,
          email: newOwner.email?.trim() || undefined,
          gender: newOwner.gender || undefined,
          age: newOwner.age ? Number(newOwner.age) : undefined,
          profession: newOwner.profession?.trim() || undefined,
          bio: newOwner.bio?.trim() || undefined,
        };
      }

      const endpoint = isEditMode ? `/api/properties/${initialData._id}` : '/api/properties';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save property');
      }

      setSubmitSuccess(
        isEditMode
          ? 'Property details updated successfully!'
          : 'Property successfully registered in database with PAUSED status!'
      );

      // Clear local storage draft
      if (!isEditMode && typeof window !== 'undefined') {
        localStorage.removeItem('fnf_property_collector_draft');
      }

      setTimeout(() => {
        router.push('/properties');
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[11px] font-semibold text-indigo-300 border border-indigo-500/30">
              {isEditMode ? 'Edit Mode' : 'New Registration'}
            </span>
            <span className="text-xs text-slate-400">Default Status: PAUSED</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-white">
            {isEditMode ? 'Update Property Details' : 'Property Detail Collection'}
          </h1>
          <p className="text-xs text-slate-400">
            Field collector form. Tabs can be switched freely at any time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditMode && (
            <button
              type="button"
              onClick={handleAutoGenerateContent}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-950/40 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/60 transition"
              title="Auto-generate Title & Description from selected specs"
            >
              <Wand2 className="h-3.5 w-3.5 text-indigo-400" />
              <span>Smart Fill Content</span>
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 transition disabled:opacity-60 active-press"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{isEditMode ? 'Save Changes' : 'Submit Property'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {submitError && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{submitError}</span>
        </div>
      )}

      {submitSuccess && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* Free Horizontal Tab Bar (Scrollable on Mobile, No restrictions) */}
      <div className="sticky top-16 z-30 -mx-4 px-4 sm:mx-0 sm:px-0 py-2 bg-[#090d16]/95 backdrop-blur-md border-y border-slate-800/80">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            const tabErrors = validationErrors.filter((e) => e.tab === tab.id);

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/50'
                    : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${isCurrent ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tabErrors.length > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white">
                    {tabErrors.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Form Contents */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6 shadow-xl backdrop-blur-sm">
        {/* ========================================================================= */}
        {/* TAB 1: OWNER INFO */}
        {/* ========================================================================= */}
        {activeTab === 'owner' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-indigo-400" />
                  Owner / Landlord Details
                </h2>
                <p className="text-xs text-slate-400">
                  Select existing owner from DB or register a new verified owner
                </p>
              </div>

              {/* Owner Mode Switch */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setOwnerMode('new')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    ownerMode === 'new'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>New Owner</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOwnerMode('select')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    ownerMode === 'select'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Select from DB</span>
                </button>
              </div>
            </div>

            {/* Mode 1: New Owner Creation */}
            {ownerMode === 'new' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>
                    New owners are automatically saved with <strong>VERIFIED</strong> status in the database.
                    Only <strong>Phone Number</strong> is mandatory.
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Phone Number (Mandatory) */}
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-200">
                      Owner Phone Number <span className="text-rose-400">* (Mandatory)</span>
                    </label>
                    <input
                      type="tel"
                      value={newOwner.phone}
                      onChange={(e) => handleNewOwnerChange('phone', e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Owner Name (Optional) */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Owner Full Name <span className="text-slate-500">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={newOwner.name}
                      onChange={(e) => handleNewOwnerChange('name', e.target.value)}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Email (Optional) */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Email Address <span className="text-slate-500">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={newOwner.email}
                      onChange={(e) => handleNewOwnerChange('email', e.target.value)}
                      placeholder="e.g. rajesh@example.com"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Gender (Optional) */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Gender <span className="text-slate-500">(Optional)</span>
                    </label>
                    <select
                      value={newOwner.gender}
                      onChange={(e) => handleNewOwnerChange('gender', e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white outline-none focus:border-indigo-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Profession (Optional) */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Profession <span className="text-slate-500">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={newOwner.profession}
                      onChange={(e) => handleNewOwnerChange('profession', e.target.value)}
                      placeholder="e.g. Business Owner / IT Professional"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Age (Optional) */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Age <span className="text-slate-500">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      value={newOwner.age}
                      onChange={(e) => handleNewOwnerChange('age', e.target.value)}
                      placeholder="e.g. 42"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Owner Notes / Bio <span className="text-slate-500">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={newOwner.bio}
                    onChange={(e) => handleNewOwnerChange('bio', e.target.value)}
                    placeholder="e.g. Preferred contact timing, owner stays in nearby society..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Mode 2: Select Existing Owner from DB */}
            {ownerMode === 'select' && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-200">
                    Search Existing Users in Database
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Search className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={ownerSearchQuery}
                      onChange={(e) => setOwnerSearchQuery(e.target.value)}
                      placeholder="Type Phone Number, Name, or Email..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Selected Owner Pill */}
                {selectedOwner && (
                  <div className="flex items-center justify-between rounded-xl border border-indigo-500/40 bg-indigo-500/10 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm">
                        {selectedOwner.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {selectedOwner.name || 'Unnamed User'}
                          </span>
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                            Selected
                          </span>
                        </div>
                        <p className="text-xs text-indigo-300">{selectedOwner.phone}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedOwner(null)}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                    >
                      Change
                    </button>
                  </div>
                )}

                {/* Search Results List */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {searchingUsers ? (
                    <div className="py-4 text-center text-xs text-slate-400">Searching database...</div>
                  ) : userSearchResults.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      No matching users found. You can click &quot;New Owner&quot; to create one.
                    </div>
                  ) : (
                    userSearchResults.map((user) => {
                      const isSelected = selectedOwner?._id === user._id;
                      return (
                        <div
                          key={user._id}
                          onClick={() => setSelectedOwner(user)}
                          className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-600/20'
                              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-sm text-white">
                              {user.name || 'No Name'}
                            </div>
                            <div className="text-xs text-slate-400">{user.phone}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500">{user.role}</span>
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'border border-slate-700 text-transparent'
                              }`}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: BASIC SPECS */}
        {/* ========================================================================= */}
        {activeTab === 'specs' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building className="h-5 w-5 text-indigo-400" />
                Property Specifications
              </h2>
              <p className="text-xs text-slate-400">
                Core configuration and space details (Required fields marked with *)
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Title (Required) */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-slate-200">
                  Property Listing Title <span className="text-rose-400">* (Required)</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  placeholder="e.g. Spacious 2BHK Apartment with Balcony in HSR Layout"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>

              {/* BHK Configuration (Required) */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-200">
                  BHK Configuration <span className="text-rose-400">* (Required)</span>
                </label>
                <select
                  value={formData.bhkConfig}
                  onChange={(e) => handleFormChange('bhkConfig', e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white outline-none focus:border-indigo-500"
                >
                  <option value="1RK">1 RK</option>
                  <option value="1BHK">1 BHK</option>
                  <option value="2BHK">2 BHK</option>
                  <option value="3BHK">3 BHK</option>
                  <option value="4BHK+">4 BHK+</option>
                </select>
              </div>

              {/* Property Type (Required) */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-200">
                  Property Type <span className="text-rose-400">* (Required)</span>
                </label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => handleFormChange('propertyType', e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white outline-none focus:border-indigo-500"
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">Independent House</option>
                  <option value="villa">Villa</option>
                  <option value="pg_hostel">PG / Hostel</option>
                </select>
              </div>

              {/* Furnishing Status (Required) */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-200">
                  Furnishing Status <span className="text-rose-400">* (Required)</span>
                </label>
                <select
                  value={formData.furnishingStatus}
                  onChange={(e) => handleFormChange('furnishingStatus', e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white outline-none focus:border-indigo-500"
                >
                  <option value="fully_furnished">Fully Furnished</option>
                  <option value="semi_furnished">Semi Furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                </select>
              </div>

              {/* Tenant Preference (Required) */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-200">
                  Tenant Preference <span className="text-rose-400">* (Required)</span>
                </label>
                <select
                  value={formData.tenantPreference}
                  onChange={(e) => handleFormChange('tenantPreference', e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white outline-none focus:border-indigo-500"
                >
                  <option value="any">Any (Family / Bachelors / Anyone)</option>
                  <option value="family">Family Only</option>
                  <option value="bachelors">Bachelors (Any)</option>
                  <option value="girls">Girls / Female Only</option>
                  <option value="boys">Boys / Male Only</option>
                </select>
              </div>

              {/* Area Sqft (Optional) */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Super Built-up Area (Sq. Ft) <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="number"
                  value={formData.areaSqft}
                  onChange={(e) => handleFormChange('areaSqft', e.target.value)}
                  placeholder="e.g. 1150"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Floor & Total Floors (Optional) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Floor <span className="text-slate-500">(Opt)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.floor}
                    onChange={(e) => handleFormChange('floor', e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Total Floors <span className="text-slate-500">(Opt)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.totalFloors}
                    onChange={(e) => handleFormChange('totalFloors', e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Management Type (Optional) */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Management Type
                </label>
                <select
                  value={formData.managementType}
                  onChange={(e) => handleFormChange('managementType', e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white outline-none focus:border-indigo-500"
                >
                  <option value="self_managed">Self Managed (Owner Direct)</option>
                  <option value="platform_managed">Platform Managed</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: LOCATION & ADDRESS */}
        {/* ========================================================================= */}
        {activeTab === 'location' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-indigo-400" />
                Interactive Map & Location
              </h2>
              <p className="text-xs text-slate-400">
                Search place or drag the pin on the map. Coordinates and location details will be captured automatically.
              </p>
            </div>

            {/* Interactive Google Map Component */}
            <MapLocationPicker
              initialLat={formData.lat}
              initialLng={formData.lng}
              onLocationSelect={handleMapLocationSelect}
            />

            {/* Address Details & Location Selectors */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
              {/* City (Required) */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-200">
                  City <span className="text-rose-400">* (Required)</span>
                </label>
                <select
                  value={formData.cityId}
                  onChange={(e) => handleFormChange('cityId', e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white outline-none focus:border-indigo-500"
                >
                  {cities.length === 0 && <option value="">Loading cities...</option>}
                  {cities.map((city) => (
                    <option key={city._id} value={city._id}>
                      {city.name} ({city.state})
                    </option>
                  ))}
                </select>
              </div>

              {/* Locality (Required) */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-200">
                  Locality / Area <span className="text-rose-400">* (Required)</span>
                </label>
                <select
                  value={formData.localityId}
                  onChange={(e) => handleFormChange('localityId', e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white outline-none focus:border-indigo-500"
                >
                  {fetchingLocalities && <option value="">Loading localities...</option>}
                  {!fetchingLocalities && localities.length === 0 && (
                    <option value="">No localities found for selected city</option>
                  )}
                  {localities.map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Address Line (Required) */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-slate-200">
                  Detailed Address Line / Flat & Building Details <span className="text-rose-400">* (Required)</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.addressLine}
                  onChange={(e) => handleFormChange('addressLine', e.target.value)}
                  placeholder="e.g. Flat 302, Wing B, Green Orchid Apartments, Sector 4"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PRICING & LEASE */}
        {/* ========================================================================= */}
        {activeTab === 'pricing' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-indigo-400" />
                Pricing, Deposit & Lease Terms
              </h2>
              <p className="text-xs text-slate-400">
                Financial terms and tenancy duration agreements
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Rent Amount (Required) */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-200">
                  Monthly Rent (₹) <span className="text-rose-400">* (Required)</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={formData.rentAmount}
                    onChange={(e) => handleFormChange('rentAmount', e.target.value)}
                    placeholder="e.g. 28000"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-3 pl-8 pr-4 text-sm font-bold text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Deposit Amount (Required) */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-200">
                  Security Deposit (₹) <span className="text-rose-400">* (Required)</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={formData.depositAmount}
                    onChange={(e) => handleFormChange('depositAmount', e.target.value)}
                    placeholder="e.g. 100000"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-3 pl-8 pr-4 text-sm font-bold text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Maintenance Amount (Optional) */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Monthly Maintenance (₹) <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="number"
                  value={formData.maintenanceAmount}
                  onChange={(e) => handleFormChange('maintenanceAmount', e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Available From (Optional, defaults to today) */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Available From Date
                </label>
                <input
                  type="date"
                  value={formData.availableFrom}
                  onChange={(e) => handleFormChange('availableFrom', e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Min Lease Months & Lock-in Months (Optional) */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Minimum Lease Duration (Months)
                </label>
                <input
                  type="number"
                  value={formData.minLeaseMonths}
                  onChange={(e) => handleFormChange('minLeaseMonths', e.target.value)}
                  placeholder="11"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Lock-in Period (Months)
                </label>
                <input
                  type="number"
                  value={formData.lockInMonths}
                  onChange={(e) => handleFormChange('lockInMonths', e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Brokerage Toggle */}
              <div className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">Brokerage Applicable?</span>
                    <p className="text-[11px] text-slate-400">
                      Does this property listing involve any brokerage fee?
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.brokerageFlag}
                    onChange={(e) => handleFormChange('brokerageFlag', e.target.checked)}
                    className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                {formData.brokerageFlag && (
                  <div className="mt-3">
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Brokerage Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.brokerageAmount}
                      onChange={(e) => handleFormChange('brokerageAmount', e.target.value)}
                      placeholder="e.g. 15000"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: AMENITIES & RULES */}
        {/* ========================================================================= */}
        {activeTab === 'amenities' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-400" />
                Amenities, Utilities & House Rules
              </h2>
              <p className="text-xs text-slate-400">
                Tap chips to select features. Free-form additions allowed.
              </p>
            </div>

            {/* Utility Dropdowns */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Power Backup</label>
                <select
                  value={formData.powerBackup}
                  onChange={(e) => handleFormChange('powerBackup', e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-2.5 text-xs text-white outline-none"
                >
                  <option value="none">None</option>
                  <option value="partial">Partial (Fans/Lights)</option>
                  <option value="full">Full 100% Backup</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Water Supply</label>
                <select
                  value={formData.waterSupplyType}
                  onChange={(e) => handleFormChange('waterSupplyType', e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-2.5 text-xs text-white outline-none"
                >
                  <option value="municipal">Municipal / Cauvery</option>
                  <option value="borewell">Borewell</option>
                  <option value="tanker">Tanker</option>
                  <option value="mixed">Mixed (Cauvery + Borewell)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Parking Type</label>
                <select
                  value={formData.parkingType}
                  onChange={(e) => handleFormChange('parkingType', e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-2.5 text-xs text-white outline-none"
                >
                  <option value="none">No Parking</option>
                  <option value="two_wheeler">2 Wheeler Only</option>
                  <option value="four_wheeler">4 Wheeler (Car) Only</option>
                  <option value="both">Both (Car + 2 Wheeler)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Pet Policy</label>
                <select
                  value={formData.petPolicy}
                  onChange={(e) => handleFormChange('petPolicy', e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-2.5 text-xs text-white outline-none"
                >
                  <option value="allowed">Allowed</option>
                  <option value="not_allowed">Not Allowed</option>
                  <option value="case_by_case">Case by Case</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Max Occupants</label>
                <input
                  type="number"
                  value={formData.maxOccupants}
                  onChange={(e) => handleFormChange('maxOccupants', e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  id="evCharge"
                  checked={formData.evChargingAvailable}
                  onChange={(e) => handleFormChange('evChargingAvailable', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 text-indigo-600"
                />
                <label htmlFor="evCharge" className="text-xs text-slate-300 font-medium cursor-pointer">
                  EV Charging Available
                </label>
              </div>
            </div>

            {/* Amenities Chips */}
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-200">
                Amenities ({formData.amenities?.length || 0} selected)
              </label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_AMENITIES.map((item) => {
                  const isSelected = formData.amenities?.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleAmenity(item)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3 text-slate-500" />}
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Amenity */}
              <div className="mt-3 flex gap-2 max-w-sm">
                <input
                  type="text"
                  value={customAmenity}
                  onChange={(e) => setCustomAmenity(e.target.value)}
                  placeholder="Custom amenity..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customAmenity.trim()) {
                      toggleAmenity(customAmenity.trim());
                      setCustomAmenity('');
                    }
                  }}
                  className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
                >
                  Add
                </button>
              </div>
            </div>

            {/* House Rules Chips */}
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-200">
                House Rules ({formData.houseRules?.length || 0} selected)
              </label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_RULES.map((rule) => {
                  const isSelected = formData.houseRules?.includes(rule);
                  return (
                    <button
                      key={rule}
                      type="button"
                      onClick={() => toggleRule(rule)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3 text-slate-500" />}
                      <span>{rule}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Safety Features Chips */}
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-200">
                Safety & Security Features ({formData.safetyFeatures?.length || 0} selected)
              </label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SAFETY.map((safety) => {
                  const isSelected = formData.safetyFeatures?.includes(safety);
                  return (
                    <button
                      key={safety}
                      type="button"
                      onClick={() => toggleSafety(safety)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3 text-slate-500" />}
                      <span>{safety}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: PHOTOS & MEDIA */}
        {/* ========================================================================= */}
        {activeTab === 'media' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header */}
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-indigo-400" />
                Property Photos & Video Walkthroughs
              </h2>
              <p className="text-xs text-slate-400">
                Attach property photos and video tours. Visual media significantly increases listing engagement.
              </p>
            </div>

            {/* SECTION 1: PHOTOS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4" />
                  <span>1. Property Photos ({formData.images?.length || 0})</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  First image or selected cover is shown as primary listing banner
                </span>
              </div>

              {/* Upload or Add Image URL Box */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                {/* Direct S3 Upload Button */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-500/40 bg-indigo-950/30 py-3.5 px-4 text-xs font-bold text-indigo-300 hover:border-indigo-400 hover:bg-indigo-900/40 transition active-press disabled:opacity-60"
                  >
                    {uploadingImage ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                        <span>Uploading Photos to S3 Bucket...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4 text-indigo-400" />
                        <span>📷 Upload Photos from Camera / Gallery (Direct S3)</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-slate-800" />
                  <span className="text-[10px] uppercase font-bold text-slate-500">or enter image URL</span>
                  <div className="h-px flex-1 bg-slate-800" />
                </div>

                {/* Paste URL */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or image URL"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white hover:bg-indigo-500 transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Photo</span>
                  </button>
                </div>
              </div>

              {/* Image Gallery List */}
              {formData.images?.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
                  No photos added yet. Upload high-res photos or paste image links above.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {formData.images?.map((img: any, idx: number) => {
                    const imgUrl = typeof img === 'string' ? img : img.url;
                    const isCover = img.isCover;

                    return (
                      <div
                        key={idx}
                        className={`group relative overflow-hidden rounded-xl border ${
                          isCover ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-800'
                        } bg-slate-950`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgUrl}
                          alt={`Photo ${idx + 1}`}
                          className="h-32 w-full object-cover"
                        />

                        {/* Cover Badge */}
                        {isCover && (
                          <div className="absolute top-2 left-2 rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                            Cover Photo
                          </div>
                        )}

                        {/* Actions overlay */}
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/70 opacity-0 transition-opacity group-hover:opacity-100">
                          {!isCover && (
                            <button
                              type="button"
                              onClick={() => handleSetCoverImage(idx)}
                              className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-indigo-500"
                            >
                              Set Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="rounded-lg bg-rose-600 p-1.5 text-white hover:bg-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 2: VIDEOS & TOURS */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <VideoIcon className="h-4 w-4 text-indigo-400" />
                  <span>2. Walkthrough Videos ({formData.videos?.length || 0})</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Supported formats: MP4, WebM, MOV (Max 100MB per file)
                </span>
              </div>

              {/* Upload or Add Video Box */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                {/* Direct Video S3 Upload */}
                <div>
                  <input
                    type="file"
                    ref={videoFileInputRef}
                    onChange={handleVideoUpload}
                    multiple
                    accept="video/mp4,video/webm,video/quicktime,video/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    disabled={uploadingVideo}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-500/40 bg-purple-950/20 py-3.5 px-4 text-xs font-bold text-purple-300 hover:border-purple-400 hover:bg-purple-900/30 transition active-press disabled:opacity-60"
                  >
                    {uploadingVideo ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                        <span>Uploading Video to S3 Bucket...</span>
                      </>
                    ) : (
                      <>
                        <VideoIcon className="h-4 w-4 text-purple-400" />
                        <span>🎥 Upload Property Video Tour (Direct S3)</span>
                      </>
                    )}
                  </button>

                  {/* Progress bars if uploading */}
                  {Object.keys(videoUploadProgress).length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {Object.entries(videoUploadProgress).map(([name, progress]) => (
                        <div key={name} className="space-y-1 text-xs">
                          <div className="flex justify-between text-[11px] text-purple-300">
                            <span className="truncate max-w-[200px]">{name}</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full bg-purple-500 transition-all duration-200"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-slate-800" />
                  <span className="text-[10px] uppercase font-bold text-slate-500">or enter direct video URL</span>
                  <div className="h-px flex-1 bg-slate-800" />
                </div>

                {/* Paste Video URL */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="https://.../tour.mp4 (Direct Video Link)"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddVideoUrl}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-3 text-xs font-bold text-white hover:bg-purple-500 transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Video</span>
                  </button>
                </div>
              </div>

              {/* Uploaded Video List */}
              {formData.videos?.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
                  No video tours attached yet. Upload a room/flat walkthrough video to give prospective tenants a 360° tour.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {formData.videos?.map((vid: any, idx: number) => {
                    const videoUrl = typeof vid === 'string' ? vid : vid.url;
                    const fileName = vid.fileName || `Video ${idx + 1}`;
                    const sizeStr = vid.sizeBytes
                      ? `${(vid.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
                      : null;

                    return (
                      <div
                        key={idx}
                        className="relative flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-2.5 space-y-2"
                      >
                        <div className="relative h-40 w-full overflow-hidden rounded-lg bg-black">
                          <video
                            src={videoUrl}
                            controls
                            preload="metadata"
                            className="h-full w-full object-contain"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2 px-1">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-white" title={fileName}>
                              {fileName}
                            </p>
                            {sizeStr && (
                              <p className="text-[10px] text-slate-400">{sizeStr}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveVideo(idx)}
                            className="shrink-0 rounded-lg bg-rose-600/80 p-1.5 text-white hover:bg-rose-500 transition"
                            title="Delete Video"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 3: YOUTUBE / CLOUD TOUR LINK */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Film className="h-4 w-4 text-amber-400" />
                <span>3. Optional External Tour Link (YouTube / Cloud Link)</span>
              </h3>
              <input
                type="url"
                value={formData.tourVideoUrl}
                onChange={(e) => handleFormChange('tourVideoUrl', e.target.value)}
                placeholder="https://youtube.com/watch?v=... or Matterport / Cloud Link"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400">
                You can paste a YouTube walkthrough link or virtual 3D tour URL here.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: REVIEW & SAVE */}
        {/* ========================================================================= */}
        {activeTab === 'review' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                Description & Final Review
              </h2>
              <p className="text-xs text-slate-400">
                Verify required fields before saving to the database.
              </p>
            </div>

            {/* Description (Required) */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-200">
                  Full Property Description <span className="text-rose-400">* (Required)</span>
                </label>
                <button
                  type="button"
                  onClick={handleAutoGenerateContent}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  <span>Auto-Write from specs</span>
                </button>
              </div>
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Detailed property description, society amenities, nearby transport, etc..."
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>

            {/* Validation Checklist Box */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Schema Mandatory Requirements Checklist
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    isValid
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {isValid ? 'All Schema Requirements Met ✓' : `${validationErrors.length} Fields Incomplete`}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                {/* Check 1: Owner */}
                <div
                  onClick={() => setActiveTab('owner')}
                  className="flex cursor-pointer items-center justify-between rounded-lg bg-slate-900 p-2.5 hover:bg-slate-800"
                >
                  <span className="text-slate-300">Owner (Phone / Selected)</span>
                  {(ownerMode === 'select' && selectedOwner?._id) ||
                  (ownerMode === 'new' && newOwner.phone?.trim()) ? (
                    <span className="text-emerald-400 font-bold">✓ Ready</span>
                  ) : (
                    <span className="text-rose-400 font-bold">✕ Missing</span>
                  )}
                </div>

                {/* Check 2: Title */}
                <div
                  onClick={() => setActiveTab('specs')}
                  className="flex cursor-pointer items-center justify-between rounded-lg bg-slate-900 p-2.5 hover:bg-slate-800"
                >
                  <span className="text-slate-300">Title & Configurations</span>
                  {formData.title?.trim() ? (
                    <span className="text-emerald-400 font-bold">✓ Ready</span>
                  ) : (
                    <span className="text-rose-400 font-bold">✕ Missing</span>
                  )}
                </div>

                {/* Check 3: Address & Coordinates */}
                <div
                  onClick={() => setActiveTab('location')}
                  className="flex cursor-pointer items-center justify-between rounded-lg bg-slate-900 p-2.5 hover:bg-slate-800"
                >
                  <span className="text-slate-300">Address & Coordinates</span>
                  {formData.addressLine?.trim() && formData.lng !== '' && formData.lat !== '' ? (
                    <span className="text-emerald-400 font-bold">✓ Ready</span>
                  ) : (
                    <span className="text-rose-400 font-bold">✕ Missing</span>
                  )}
                </div>

                {/* Check 4: Rent & Deposit */}
                <div
                  onClick={() => setActiveTab('pricing')}
                  className="flex cursor-pointer items-center justify-between rounded-lg bg-slate-900 p-2.5 hover:bg-slate-800"
                >
                  <span className="text-slate-300">Rent & Deposit Amounts</span>
                  {formData.rentAmount !== '' && formData.depositAmount !== '' ? (
                    <span className="text-emerald-400 font-bold">✓ Ready</span>
                  ) : (
                    <span className="text-rose-400 font-bold">✕ Missing</span>
                  )}
                </div>

                {/* Check 5: Media Attachments */}
                <div
                  onClick={() => setActiveTab('media')}
                  className="flex cursor-pointer items-center justify-between rounded-lg bg-slate-900 p-2.5 hover:bg-slate-800 sm:col-span-2"
                >
                  <span className="text-slate-300">Attached Media</span>
                  <span className="text-indigo-400 font-semibold">
                    {formData.images?.length || 0} Photos · {formData.videos?.length || 0} Videos · {formData.tourVideoUrl ? 'Virtual Tour Added' : 'No Tour URL'}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 transition disabled:opacity-60 active-press"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>{isEditMode ? 'Save Property Updates' : 'Confirm & Register Property (PAUSED)'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Step Switcher Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => {
            const currentIdx = TABS.findIndex((t) => t.id === activeTab);
            if (currentIdx > 0) setActiveTab(TABS[currentIdx - 1].id);
          }}
          disabled={activeTab === TABS[0].id}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Previous Tab</span>
        </button>

        <button
          type="button"
          onClick={() => {
            const currentIdx = TABS.findIndex((t) => t.id === activeTab);
            if (currentIdx < TABS.length - 1) setActiveTab(TABS[currentIdx + 1].id);
          }}
          disabled={activeTab === TABS[TABS.length - 1].id}
          className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-30"
        >
          <span>Next Tab</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
