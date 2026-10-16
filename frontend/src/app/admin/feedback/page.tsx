'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  X,
  MapPin,
  Calendar,
  Building2,
  FileCheck2,
  Star,
  User,
  EyeOff,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useFeedback } from '@/context/FeedbackContext';
import { FilterBar } from '@/components/admin/FilterBar';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { StarRating } from '@/components/ui/StarRating';
import { Badge, SentimentBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FeedbackRecord } from '@/types/feedback';

export default function FeedbackExplorerPage() {
  const { filteredFeedbacks, deleteFeedback } = useFeedback();

  // Selected feedback for detail view modal
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackRecord | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Sorting
  const [sortBy, setSortBy] = useState<'newest' | 'rating_high' | 'rating_low'>('newest');

  // Sorted and Paginated items
  const sortedFeedbacks = useMemo(() => {
    return [...filteredFeedbacks].sort((a, b) => {
      if (sortBy === 'rating_high') return b.overallRating - a.overallRating;
      if (sortBy === 'rating_low') return a.overallRating - b.overallRating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filteredFeedbacks, sortBy]);

  const totalPages = Math.ceil(sortedFeedbacks.length / itemsPerPage) || 1;
  const paginatedFeedbacks = sortedFeedbacks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Client-side CSV export
  const handleExportCSV = () => {
    if (filteredFeedbacks.length === 0) return;

    const headers = [
      'Reference ID',
      'Date',
      'District',
      'Local Area',
      'Department',
      'Service',
      'Overall Rating',
      'Helpfulness',
      'Communication',
      'Professionalism',
      'Response Time',
      'Sentiment',
      'Sentiment Score',
      'Summary Comment',
      'Anonymous',
      'Citizen Name',
    ];

    const rows = filteredFeedbacks.map((f) => [
      `"${f.referenceId}"`,
      `"${new Date(f.createdAt).toISOString()}"`,
      `"${f.location.district}"`,
      `"${f.location.localArea}"`,
      `"${f.departmentName}"`,
      `"${f.serviceName}"`,
      f.overallRating,
      f.categoryRatings.helpfulness,
      f.categoryRatings.communication,
      f.categoryRatings.professionalism,
      f.categoryRatings.responseTime,
      `"${f.sentiment}"`,
      f.sentimentScore,
      `"${f.summaryComment.replace(/"/g, '""')}"`,
      f.isAnonymous ? 'Yes' : 'No',
      `"${f.citizenName || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CivicConnect_Feedback_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar with Search */}
      <FilterBar />

      {/* Main Table Card */}
      <Card>
        <CardHeader className="py-4 px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Submitted Feedback Records</h3>
            <p className="text-xs text-stone-500">
              Showing {paginatedFeedbacks.length} of {filteredFeedbacks.length} filtered items
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setCurrentPage(1);
              }}
              className="text-xs rounded-xl border border-stone-200 px-3 py-1.5 bg-white text-stone-700"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="rating_high">Sort: Highest Rating</option>
              <option value="rating_low">Sort: Lowest Rating</option>
            </select>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredFeedbacks.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </CardHeader>

        {/* Responsive Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5F5]/40 border-y border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-6">Reference ID</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Department & Service</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Sentiment</th>
                <th className="py-3 px-4">Feedback Preview</th>
                <th className="py-3 px-4 text-center">Media</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {paginatedFeedbacks.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                  {/* Reference ID */}
                  <td className="py-3.5 px-6 font-mono font-medium text-stone-900 whitespace-nowrap">
                    {item.referenceId}
                    <span className="block text-[10px] text-stone-400 font-sans font-normal">
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </td>

                  {/* Location */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-semibold text-stone-900 block">{item.location.district}</span>
                    <span className="text-[11px] text-stone-500 block">{item.location.localArea}</span>
                  </td>

                  {/* Dept & Service */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <span className="font-medium text-stone-900 block truncate" title={item.serviceName}>
                      {item.serviceName}
                    </span>
                    <span className="text-[11px] text-stone-400 block truncate">{item.departmentName}</span>
                  </td>

                  {/* Rating */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StarRating value={item.overallRating} readOnly size="sm" />
                    <span className="text-[10px] text-stone-400 font-mono block mt-0.5">
                      {item.overallRating} / 5.0
                    </span>
                  </td>

                  {/* Sentiment */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <SentimentBadge sentiment={item.sentiment} score={item.sentimentScore} />
                  </td>

                  {/* Summary comment */}
                  <td className="py-3.5 px-4 max-w-sm truncate text-stone-600" title={item.summaryComment}>
                    {item.summaryComment}
                  </td>

                  {/* Media */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {item.attachments.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-stone-600 font-mono bg-stone-100 px-2 py-0.5 rounded-md">
                        <Paperclip className="w-3 h-3" />
                        {item.attachments.length}
                      </span>
                    ) : (
                      <span className="text-stone-300">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedFeedback(item)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                        title="View Full Record"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete feedback record ${item.referenceId}?`)) {
                            deleteFeedback(item.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Demo Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {paginatedFeedbacks.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400 text-xs">
                    No submitted feedback matches the current search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Slide-Over Detail Modal */}
      {selectedFeedback && (
        <Modal
          isOpen={Boolean(selectedFeedback)}
          onClose={() => setSelectedFeedback(null)}
          title={`Feedback Record: ${selectedFeedback.referenceId}`}
          description={`Submitted on ${new Date(selectedFeedback.createdAt).toLocaleString()}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs text-stone-700">
            {/* Top Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] text-stone-400 uppercase font-semibold block">Overall Rating</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <StarRating value={selectedFeedback.overallRating} readOnly size="sm" />
                  <span className="font-bold text-stone-900">{selectedFeedback.overallRating} / 5</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] text-stone-400 uppercase font-semibold block">Sentiment</span>
                <div className="mt-1">
                  <SentimentBadge sentiment={selectedFeedback.sentiment} score={selectedFeedback.sentimentScore} />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] text-stone-400 uppercase font-semibold block">Jurisdiction</span>
                <span className="font-semibold text-stone-900 block mt-1">
                  {selectedFeedback.location.district}
                </span>
                <span className="text-stone-500 text-[11px] block">{selectedFeedback.location.localArea}</span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] text-stone-400 uppercase font-semibold block">Citizen Identity</span>
                <span className="font-semibold text-stone-900 block mt-1">
                  {selectedFeedback.isAnonymous ? 'Anonymous' : selectedFeedback.citizenName}
                </span>
                {selectedFeedback.citizenContact && (
                  <span className="text-stone-500 text-[10px] block truncate">{selectedFeedback.citizenContact}</span>
                )}
              </div>
            </div>

            {/* Department & Service */}
            <div className="p-3.5 rounded-xl border border-stone-200 bg-white space-y-1">
              <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider">
                Department & Service Evaluated
              </span>
              <p className="font-semibold text-stone-900 text-sm">{selectedFeedback.serviceName}</p>
              <p className="text-stone-500 text-xs">{selectedFeedback.departmentName}</p>
            </div>

            {/* 4 Dimension Ratings Grid */}
            <div>
              <span className="text-xs font-semibold text-stone-900 block mb-2">
                Dimension Ratings Breakdown
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-lg border border-stone-100 bg-[#FBFBF9] text-center">
                  <span className="text-stone-500 block text-[11px]">Helpfulness</span>
                  <span className="font-bold text-stone-900 text-sm mt-0.5 block">
                    ★ {selectedFeedback.categoryRatings.helpfulness} / 5
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-stone-100 bg-[#FBFBF9] text-center">
                  <span className="text-stone-500 block text-[11px]">Communication</span>
                  <span className="font-bold text-stone-900 text-sm mt-0.5 block">
                    ★ {selectedFeedback.categoryRatings.communication} / 5
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-stone-100 bg-[#FBFBF9] text-center">
                  <span className="text-stone-500 block text-[11px]">Professionalism</span>
                  <span className="font-bold text-stone-900 text-sm mt-0.5 block">
                    ★ {selectedFeedback.categoryRatings.professionalism} / 5
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-stone-100 bg-[#FBFBF9] text-center">
                  <span className="text-stone-500 block text-[11px]">Response Time</span>
                  <span className="font-bold text-stone-900 text-sm mt-0.5 block">
                    ★ {selectedFeedback.categoryRatings.responseTime} / 5
                  </span>
                </div>
              </div>
            </div>

            {/* Narrative & Comments */}
            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-stone-500 uppercase block mb-1">
                  One-Sentence Summary
                </span>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 font-medium">
                  &ldquo;{selectedFeedback.summaryComment}&rdquo;
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-stone-500 uppercase block mb-1">
                  Detailed Narrative
                </span>
                <div className="p-3.5 rounded-xl bg-white border border-stone-200 text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {selectedFeedback.detailedDescription}
                </div>
              </div>
            </div>

            {/* Detected Pattern Keywords */}
            {selectedFeedback.keywords.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-stone-500 uppercase block mb-1.5">
                  Classifier Detected Trigger Words
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFeedback.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[11px] border border-stone-200 font-mono"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments Section */}
            {selectedFeedback.attachments.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-stone-500 uppercase block mb-2">
                  Uploaded Supporting Evidence ({selectedFeedback.attachments.length})
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {selectedFeedback.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white border border-stone-200 flex items-center justify-center shrink-0">
                        {att.previewUrl ? (
                          <img
                            src={att.previewUrl}
                            alt={att.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <FileText className="w-5 h-5 text-stone-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-stone-900 truncate">{att.name}</p>
                        <p className="text-[10px] text-stone-400">
                          {(att.size / 1024).toFixed(0)} KB • Supporting Context
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete feedback ${selectedFeedback.referenceId}?`)) {
                    deleteFeedback(selectedFeedback.id);
                    setSelectedFeedback(null);
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Feedback</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFeedback(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors"
              >
                Close Record
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
