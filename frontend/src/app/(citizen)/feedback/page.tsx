'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Building2,
  FileCheck2,
  Star,
  Upload,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  Lock,
  EyeOff,
  User,
  Info,
  Sparkles,
} from 'lucide-react';
import { useFeedback } from '@/context/FeedbackContext';
import { KERALA_DISTRICTS } from '@/data/keralaData';
import { Card, CardContent } from '@/components/ui/Card';
import { StarRating } from '@/components/ui/StarRating';
import { SentimentBadge } from '@/components/ui/Badge';
import { FeedbackAttachment, StructuredAnswers, FeedbackRecord } from '@/types/feedback';

function FeedbackFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDeptParam = searchParams.get('dept');

  const { departments, addFeedback } = useFeedback();

  // Multi-step progress (1: Location & Service, 2: Ratings & Comments, 3: Evidence & Description, 4: Confirmation)
  const [step, setStep] = useState<number>(1);

  // Form State - Step 1
  const [district, setDistrict] = useState<string>('Thiruvananthapuram');
  const [localArea, setLocalArea] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>(initialDeptParam || 'dept-revenue');
  const [serviceId, setServiceId] = useState<string>('');
  const [serviceSearch, setServiceSearch] = useState<string>('');

  // Form State - Step 2
  const [overallRating, setOverallRating] = useState<number>(5);
  const [helpfulness, setHelpfulness] = useState<number>(5);
  const [communication, setCommunication] = useState<number>(5);
  const [professionalism, setProfessionalism] = useState<number>(5);
  const [responseTime, setResponseTime] = useState<number>(5);
  const [structuredAnswers, setStructuredAnswers] = useState<StructuredAnswers>({
    timelyDelivery: 'yes',
    processClarity: 'very_clear',
    digitalAccessUsed: true,
  });
  const [summaryComment, setSummaryComment] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [citizenName, setCitizenName] = useState<string>('');
  const [citizenContact, setCitizenContact] = useState<string>('');

  // Form State - Step 3
  const [detailedDescription, setDetailedDescription] = useState<string>('');
  const [attachments, setAttachments] = useState<FeedbackAttachment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Form State - Step 4 (Submission Result)
  const [submittedRecord, setSubmittedRecord] = useState<FeedbackRecord | null>(null);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Active department object
  const activeDept = departments.find((d) => d.id === departmentId) || departments[0];

  // Set default service when department changes
  useEffect(() => {
    if (activeDept && activeDept.services.length > 0) {
      // If current serviceId is not in activeDept, select first service
      if (!activeDept.services.some((s) => s.id === serviceId)) {
        setServiceId(activeDept.services[0].id);
      }
    }
  }, [departmentId, activeDept, serviceId]);

  // Set default local area when district changes
  useEffect(() => {
    const distInfo = KERALA_DISTRICTS[district];
    if (distInfo && distInfo.taluks.length > 0) {
      setLocalArea(distInfo.taluks[0]);
    }
  }, [district]);

  // Handle file selection (with base64 preview simulation for images)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: FeedbackAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate size (max 8MB per file)
      if (file.size > 8 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds 8MB size limit.`);
        continue;
      }

      // Check file types (images, pdf, video mp4/webm)
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4'];
      if (!allowed.includes(file.type)) {
        setUploadError(`File "${file.name}" is an unsupported format. Please upload JPG, PNG, PDF, or MP4.`);
        continue;
      }

      const id = `att-${Date.now()}-${i}`;
      let previewUrl: string | undefined;

      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      newAttachments.push({
        id,
        name: file.name,
        type: file.type,
        size: file.size,
        previewUrl,
        isDemo: true,
      });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Step 1 Validation
  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!district) errors.district = 'Please select a district';
    if (!localArea) errors.localArea = 'Please select a local area or taluk';
    if (!departmentId) errors.department = 'Please select a government department';
    if (!serviceId) errors.service = 'Please select a specific service';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    if (!overallRating || overallRating < 1) errors.overallRating = 'Please select an overall rating';
    if (!summaryComment.trim()) {
      errors.summaryComment = 'Please provide a short summary comment (at least 10 characters)';
    } else if (summaryComment.trim().length < 10) {
      errors.summaryComment = 'Summary comment should be at least 10 characters long';
    }

    if (!isAnonymous) {
      if (!citizenName.trim()) {
        errors.citizenName = 'Please enter your name for identified submission';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 3 Validation & Submit
  const handleFinalSubmit = () => {
    const errors: Record<string, string> = {};
    if (!detailedDescription.trim()) {
      errors.detailedDescription = 'Please provide detailed context about your service experience';
    } else if (detailedDescription.trim().length < 20) {
      errors.detailedDescription = 'Detailed description should be at least 20 characters long';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const distInfo = KERALA_DISTRICTS[district];
    const serviceObj = activeDept.services.find((s) => s.id === serviceId);

    const record = addFeedback({
      location: {
        state: 'Kerala',
        district,
        localArea,
        coordinates: distInfo?.coordinates || [10.5, 76.2],
      },
      departmentId,
      departmentName: activeDept.name,
      serviceId,
      serviceName: serviceObj?.name || 'Public Service',
      overallRating,
      categoryRatings: {
        helpfulness,
        communication,
        professionalism,
        responseTime,
      },
      structuredAnswers,
      summaryComment,
      detailedDescription,
      isAnonymous,
      citizenName: isAnonymous ? undefined : citizenName,
      citizenContact: isAnonymous ? undefined : citizenContact,
      attachments,
    });

    setSubmittedRecord(record);
    setStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered services in dropdown/search
  const filteredServices = activeDept.services.filter((s) =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    s.description.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Step Progress Bar (Hidden on Confirmation Step) */}
      {step < 4 && (
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between mb-3 text-xs font-medium text-stone-500">
            <span className={step >= 1 ? 'text-[#38523F] font-semibold' : ''}>1. Service & Office</span>
            <span className={step >= 2 ? 'text-[#38523F] font-semibold' : ''}>2. Ratings & Experience</span>
            <span className={step >= 3 ? 'text-[#38523F] font-semibold' : ''}>3. Details & Evidence</span>
            <span>4. Confirmation</span>
          </div>
          <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#46664F] h-full transition-all duration-300"
              style={{ width: `${((step - 1) / 3) * 100 + 25}%` }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: LOCATION & SERVICE SELECTION                                     */}
      {/* ========================================================================= */}
      {step === 1 && (
        <Card className="animate-in fade-in duration-200">
          <CardContent className="p-6 sm:p-10 space-y-8">
            <div className="border-b border-stone-100 pb-6">
              <span className="text-xs font-semibold text-[#46664F] uppercase tracking-wider">Step 1 of 3</span>
              <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mt-1">
                Where & What Service Did You Access?
              </h1>
              <p className="text-sm text-stone-600 mt-1.5 leading-relaxed">
                Specify the government office location and service you are evaluating. This ensures feedback is aggregated to the correct administrative circle.
              </p>
            </div>

            {/* Location Fields */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#46664F]" />
                <span>Office Location (Kerala)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* District */}
                <div>
                  <label htmlFor="district-select" className="block text-xs font-medium text-stone-700 mb-1.5">
                    District <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="district-select"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#46664F] focus:border-transparent bg-white"
                  >
                    {Object.keys(KERALA_DISTRICTS).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  {validationErrors.district && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.district}</p>
                  )}
                </div>

                {/* Local Area / Taluk */}
                <div>
                  <label htmlFor="taluk-select" className="block text-xs font-medium text-stone-700 mb-1.5">
                    Taluk / Local Office Jurisdiction <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="taluk-select"
                    value={localArea}
                    onChange={(e) => setLocalArea(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#46664F] focus:border-transparent bg-white"
                  >
                    {(KERALA_DISTRICTS[district]?.taluks || []).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {validationErrors.localArea && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.localArea}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Department Selection */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#46664F]" />
                <span>Government Department <span className="text-red-500">*</span></span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {departments.map((dept) => {
                  const isSelected = dept.id === departmentId;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => {
                        setDepartmentId(dept.id);
                        setServiceSearch('');
                      }}
                      className={`text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-[#46664F] bg-[#EBF2ED] shadow-xs'
                          : 'border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-[#46664F] text-white' : 'bg-stone-100 text-stone-600'
                      }`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium leading-tight ${isSelected ? 'text-[#2C4032]' : 'text-stone-900'}`}>
                          {dept.name}
                        </p>
                        <p className="text-xs text-stone-500 mt-0.5">{dept.services.length} services listed</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {validationErrors.department && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.department}</p>
              )}
            </div>

            {/* Specific Service Selection */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-[#46664F]" />
                  <span>Specific Public Service <span className="text-red-500">*</span></span>
                </h3>
                <input
                  type="text"
                  placeholder="Filter services..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-[#46664F]"
                />
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {filteredServices.length === 0 ? (
                  <p className="text-xs text-stone-500 p-4 bg-stone-50 rounded-xl text-center">
                    No services match &quot;{serviceSearch}&quot;.
                  </p>
                ) : (
                  filteredServices.map((srv) => {
                    const isSelected = srv.id === serviceId;
                    return (
                      <label
                        key={srv.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-[#46664F] bg-[#F2F7F4]'
                            : 'border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="service-radio"
                          checked={isSelected}
                          onChange={() => setServiceId(srv.id)}
                          className="mt-1 text-[#46664F] focus:ring-[#46664F]"
                        />
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${isSelected ? 'text-[#2C4032]' : 'text-stone-900'}`}>
                            {srv.name}
                          </p>
                          <p className="text-xs text-stone-500 mt-0.5">{srv.description}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-mono">
                          {srv.code}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
              {validationErrors.service && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.service}</p>
              )}
            </div>

            {/* Step 1 Actions */}
            <div className="pt-6 border-t border-stone-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) {
                    setStep(2);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-[#46664F] text-white hover:bg-[#38523F] transition-colors shadow-xs"
              >
                <span>Continue to Ratings</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: RATINGS & FEEDBACK                                                */}
      {/* ========================================================================= */}
      {step === 2 && (
        <Card className="animate-in fade-in duration-200">
          <CardContent className="p-6 sm:p-10 space-y-8">
            <div className="border-b border-stone-100 pb-6 flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-[#46664F] uppercase tracking-wider">Step 2 of 3</span>
                <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mt-1">
                  Rate Your Experience
                </h1>
                <p className="text-sm text-stone-600 mt-1.5 leading-relaxed">
                  Evaluating: <strong className="text-stone-900">{activeDept.services.find((s) => s.id === serviceId)?.name}</strong> in {localArea}, {district}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-stone-500 hover:text-stone-800 underline"
              >
                Change Office
              </button>
            </div>

            {/* Overall Rating (1-5) */}
            <div className="bg-[#FAF5F5]/60 border border-[#E8D7D8] rounded-2xl p-6 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-base font-semibold text-stone-900 block">
                    Overall Service Quality <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-stone-500">How would you summarize your overall experience with this service?</p>
                </div>
                <StarRating
                  value={overallRating}
                  onChange={(v) => setOverallRating(v)}
                  size="lg"
                  showLabel
                />
              </div>
              {validationErrors.overallRating && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.overallRating}</p>
              )}
            </div>

            {/* 4 Category Ratings */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-stone-900">
                Detailed Evaluation Dimensions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Helpfulness */}
                <div className="p-4 rounded-xl border border-stone-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-800">Staff Helpfulness</span>
                    <StarRating value={helpfulness} onChange={setHelpfulness} size="sm" />
                  </div>
                  <p className="text-[11px] text-stone-500 leading-tight">Willingness of frontline personnel to assist with queries.</p>
                </div>

                {/* Communication */}
                <div className="p-4 rounded-xl border border-stone-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-800">Clear Communication</span>
                    <StarRating value={communication} onChange={setCommunication} size="sm" />
                  </div>
                  <p className="text-[11px] text-stone-500 leading-tight">Clarity of guidance, notices, and procedural instructions.</p>
                </div>

                {/* Professionalism */}
                <div className="p-4 rounded-xl border border-stone-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-800">Office Professionalism</span>
                    <StarRating value={professionalism} onChange={setProfessionalism} size="sm" />
                  </div>
                  <p className="text-[11px] text-stone-500 leading-tight">Courteous conduct, counter discipline, and fairness.</p>
                </div>

                {/* Response Time */}
                <div className="p-4 rounded-xl border border-stone-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-800">Speed & Response Time</span>
                    <StarRating value={responseTime} onChange={setResponseTime} size="sm" />
                  </div>
                  <p className="text-[11px] text-stone-500 leading-tight">Promptness in processing, counter turnaround, or delivery.</p>
                </div>
              </div>
            </div>

            {/* Structured Questions */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <h3 className="text-sm font-semibold text-stone-900">
                Service Delivery Conditions
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Timely Delivery */}
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    Was the service completed in expected timeframe?
                  </label>
                  <select
                    value={structuredAnswers.timelyDelivery}
                    onChange={(e) =>
                      setStructuredAnswers((prev) => ({
                        ...prev,
                        timelyDelivery: e.target.value as StructuredAnswers['timelyDelivery'],
                      }))
                    }
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs text-stone-900 bg-white"
                  >
                    <option value="yes">Yes, within stipulated citizen charter time</option>
                    <option value="minor_delay">Minor delay (1 to 3 days extra)</option>
                    <option value="significant_delay">Significant delay (over a week extra)</option>
                  </select>
                </div>

                {/* Delivery Channel */}
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    Service Delivery Channel
                  </label>
                  <select
                    value={structuredAnswers.digitalAccessUsed ? 'digital' : 'physical'}
                    onChange={(e) =>
                      setStructuredAnswers((prev) => ({
                        ...prev,
                        digitalAccessUsed: e.target.value === 'digital',
                      }))
                    }
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs text-stone-900 bg-white"
                  >
                    <option value="digital">Online Portal / Akshaya e-Service</option>
                    <option value="physical">Physical Taluk / Hospital / RTO Office Counter</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Summary Comment */}
            <div className="space-y-2 pt-4 border-t border-stone-100">
              <label htmlFor="summary-comment" className="block text-sm font-semibold text-stone-900">
                One-Sentence Feedback Summary <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-stone-500">
                Highlight the most notable positive or bottleneck aspect of your interaction.
              </p>
              <input
                id="summary-comment"
                type="text"
                value={summaryComment}
                onChange={(e) => setSummaryComment(e.target.value)}
                placeholder="e.g. Driving license test was handled very efficiently, but queue token machine was jammed."
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#46664F] focus:border-transparent bg-white"
              />
              {validationErrors.summaryComment && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.summaryComment}</p>
              )}
            </div>

            {/* Anonymous vs Identified Toggle */}
            <div className="pt-4 border-t border-stone-100 space-y-4">
              <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#46664F]" />
                <span>Identity & Privacy Preference</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsAnonymous(true)}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 cursor-pointer transition-all ${
                    isAnonymous
                      ? 'border-[#46664F] bg-[#EBF2ED]'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <EyeOff className={`w-5 h-5 shrink-0 mt-0.5 ${isAnonymous ? 'text-[#38523F]' : 'text-stone-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-stone-900">Submit Anonymously</p>
                    <p className="text-xs text-stone-500 mt-0.5">Your name and contact will never be recorded or visible to officials.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAnonymous(false)}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 cursor-pointer transition-all ${
                    !isAnonymous
                      ? 'border-[#46664F] bg-[#EBF2ED]'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <User className={`w-5 h-5 shrink-0 mt-0.5 ${!isAnonymous ? 'text-[#38523F]' : 'text-stone-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-stone-900">Identified Submission</p>
                    <p className="text-xs text-stone-500 mt-0.5">Provide your name for verification and citizen survey recognition.</p>
                  </div>
                </button>
              </div>

              {!isAnonymous && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200 animate-in fade-in">
                  <div>
                    <label htmlFor="citizen-name" className="block text-xs font-medium text-stone-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="citizen-name"
                      type="text"
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 bg-white"
                    />
                    {validationErrors.citizenName && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.citizenName}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="citizen-contact" className="block text-xs font-medium text-stone-700 mb-1">
                      Email or Mobile (Optional)
                    </label>
                    <input
                      id="citizen-contact"
                      type="text"
                      value={citizenContact}
                      onChange={(e) => setCitizenContact(e.target.value)}
                      placeholder="e.g. rajesh@example.com"
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 Actions */}
            <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (validateStep2()) {
                    setStep(3);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-[#46664F] text-white hover:bg-[#38523F] transition-colors shadow-xs"
              >
                <span>Continue to Evidence</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: DESCRIPTION & EVIDENCE                                            */}
      {/* ========================================================================= */}
      {step === 3 && (
        <Card className="animate-in fade-in duration-200">
          <CardContent className="p-6 sm:p-10 space-y-8">
            <div className="border-b border-stone-100 pb-6">
              <span className="text-xs font-semibold text-[#46664F] uppercase tracking-wider">Step 3 of 3</span>
              <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mt-1">
                Detailed Narrative & Supporting Evidence
              </h1>
              <p className="text-sm text-stone-600 mt-1.5 leading-relaxed">
                Provide specifics regarding what transpired. You may attach photos of tokens, notice boards, premises, or portal screenshots.
              </p>
            </div>

            {/* Detailed Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="detailed-desc" className="block text-sm font-semibold text-stone-900">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-stone-400">
                  {detailedDescription.length} characters (min 20)
                </span>
              </div>
              <textarea
                id="detailed-desc"
                rows={5}
                value={detailedDescription}
                onChange={(e) => setDetailedDescription(e.target.value)}
                placeholder="Describe what occurred during your interaction: procedural steps taken, guidance given, wait duration, whether digital receipts were generated, and any suggestions for improvement..."
                className="w-full rounded-xl border border-stone-300 p-3.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#46664F] focus:border-transparent bg-white leading-relaxed"
              />
              {validationErrors.detailedDescription && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.detailedDescription}</p>
              )}
            </div>

            {/* Privacy Alert Reminder */}
            <div className="p-4 rounded-xl bg-[#FEF8EB] border border-[#FDE68A] flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
              <div className="text-xs text-[#92400E] space-y-1">
                <p className="font-semibold">Important Privacy & Evidence Reminder</p>
                <p className="leading-relaxed">
                  Please do <strong>NOT</strong> upload sensitive confidential documents such as complete Aadhaar numbers, PAN cards, bank account statements, medical diagnoses, or debit/credit card copies.
                </p>
                <p className="text-[11px] text-[#B45309]">
                  Text and star ratings are parsed automatically to calculate aggregate sentiment, while media files serve exclusively as supporting context for administrative reviews.
                </p>
              </div>
            </div>

            {/* Attachment Upload Zone */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-stone-900">
                Supporting Attachments (Optional)
              </label>

              <div className="border-2 border-dashed border-stone-300 hover:border-[#46664F] rounded-2xl p-6 text-center transition-colors bg-[#FBFBF9]">
                <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-stone-800">
                  Drop images, PDFs, or photos here, or browse
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Supported formats: JPG, PNG, WebP, PDF, MP4 (Max 8MB each)
                </p>

                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#38523F] bg-[#EBF2ED] hover:bg-[#DCE9E0] cursor-pointer transition-colors"
                >
                  Choose Files
                </label>
              </div>

              {uploadError && (
                <p className="text-xs text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {uploadError}
                </p>
              )}

              {/* Uploaded Files Preview List */}
              {attachments.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-medium text-stone-700">Attached Files ({attachments.length}):</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-white"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {att.previewUrl ? (
                            <img
                              src={att.previewUrl}
                              alt={att.name}
                              className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 text-stone-500" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-stone-900 truncate">{att.name}</p>
                            <p className="text-[10px] text-stone-400">
                              {(att.size / 1024).toFixed(0)} KB
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-stone-50 transition-colors"
                          aria-label={`Remove ${att.name}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 3 Actions */}
            <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-medium bg-[#46664F] text-white hover:bg-[#38523F] transition-all shadow-md hover:shadow-lg"
              >
                <span>Submit Feedback</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: SUBMISSION CONFIRMATION                                           */}
      {/* ========================================================================= */}
      {step === 4 && submittedRecord && (
        <div className="space-y-6 animate-in zoom-in-95 duration-200">
          <Card className="border-[#CADACF] bg-white overflow-hidden shadow-sm">
            <div className="bg-[#EBF2ED] p-8 sm:p-10 text-center border-b border-[#CADACF]">
              <div className="w-16 h-16 rounded-full bg-[#46664F] text-white flex items-center justify-center mx-auto mb-4 shadow-sm animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <span className="text-xs font-bold text-[#38523F] uppercase tracking-wider">
                Submission Acknowledged
              </span>
              <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mt-1">
                Thank You for Helping Improve Public Administration
              </h1>
              <p className="text-sm text-stone-600 max-w-xl mx-auto mt-2 leading-relaxed">
                Your feedback has been successfully processed and added to the state service analytics dataset.
              </p>

              {/* Reference ID Pill */}
              <div className="mt-6 inline-flex flex-col sm:flex-row items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-[#CADACF] shadow-2xs">
                <span className="text-xs text-stone-500 uppercase tracking-wider font-medium">Demo Reference ID:</span>
                <span className="font-mono text-base font-bold text-[#2C4032]">
                  {submittedRecord.referenceId}
                </span>
              </div>
            </div>

            <CardContent className="p-6 sm:p-10 space-y-6">
              {/* Summary Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
                  <span className="text-stone-400 block mb-0.5">Department & Service</span>
                  <span className="font-semibold text-stone-900 text-sm block">{submittedRecord.serviceName}</span>
                  <span className="text-stone-500">{submittedRecord.departmentName}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
                  <span className="text-stone-400 block mb-0.5">Jurisdiction</span>
                  <span className="font-semibold text-stone-900 text-sm block">{submittedRecord.location.localArea}</span>
                  <span className="text-stone-500">{submittedRecord.location.district}, Kerala</span>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
                  <span className="text-stone-400 block mb-0.5">Citizen Experience Score</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarRating value={submittedRecord.overallRating} readOnly size="sm" />
                    <span className="font-bold text-stone-900">{submittedRecord.overallRating} / 5</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
                  <span className="text-stone-400 block mb-0.5">Sentiment Classification</span>
                  <div className="mt-1">
                    <SentimentBadge sentiment={submittedRecord.sentiment} score={submittedRecord.sentimentScore} />
                  </div>
                </div>
              </div>

              {/* Disclaimers & Clarifications */}
              <div className="p-4 rounded-xl bg-[#FBFBF9] border border-stone-200 text-xs text-stone-600 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-stone-800">
                  <Info className="w-4 h-4 text-[#46664F]" />
                  <span>Important Note on Governance Scope</span>
                </div>
                <p className="leading-relaxed">
                  CivicConnect is an analytical intelligence platform designed to track recurring service quality trends and guide structural reforms across Kerala departments. <strong>This reference number is generated for dataset tracking and survey verification; it is not an individual grievance ticket.</strong>
                </p>
                <p className="text-[11px] text-stone-500">
                  For individual dispute redressal or official statutory petitions, citizens may access the state CMDRF or respective department grievance portals.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Link
                  href="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition-colors shadow-2xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Homepage</span>
                </Link>

                <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setSummaryComment('');
                      setDetailedDescription('');
                      setAttachments([]);
                      setSubmittedRecord(null);
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-[#38523F] bg-[#EBF2ED] hover:bg-[#DCE9E0] transition-colors"
                  >
                    <span>Submit Another Feedback</span>
                  </button>

                  <Link
                    href="/admin/feedback"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium bg-[#46664F] text-white hover:bg-[#38523F] transition-colors shadow-xs"
                  >
                    <span>Inspect in Admin Suite</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto p-12 text-center text-stone-500">Loading form...</div>}>
      <FeedbackFormContent />
    </Suspense>
  );
}
