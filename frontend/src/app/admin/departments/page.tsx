'use client';

import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Mail,
  User,
  RotateCcw,
  Layers,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useFeedback } from '@/context/FeedbackContext';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Department, GovernmentService } from '@/types/feedback';

export default function DepartmentManagementPage() {
  const {
    departments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addServiceToDepartment,
    deleteServiceFromDepartment,
    resetToDefaultData,
  } = useFeedback();

  // State for expanded departments in UI
  const [expandedDeptId, setExpandedDeptId] = useState<string | null>(departments[0]?.id || null);

  // Modal states
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [addingServiceToDeptId, setAddingServiceToDeptId] = useState<string | null>(null);

  // Form states for Add/Edit Department
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDescription, setDeptDescription] = useState('');
  const [deptEmail, setDeptEmail] = useState('');
  const [deptNodalOfficer, setDeptNodalOfficer] = useState('');
  const [deptFormError, setDeptFormError] = useState<string | null>(null);

  // Form states for Add Service
  const [serviceName, setServiceName] = useState('');
  const [serviceCode, setServiceCode] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [serviceFormError, setServiceFormError] = useState<string | null>(null);

  // Open Edit Modal
  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptCode(dept.code);
    setDeptDescription(dept.description);
    setDeptEmail(dept.contactEmail);
    setDeptNodalOfficer(dept.nodalOfficer);
    setDeptFormError(null);
  };

  // Save Add/Edit Department
  const handleSaveDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    setDeptFormError(null);

    if (!deptName.trim() || !deptCode.trim() || !deptDescription.trim()) {
      setDeptFormError('Please fill in Department Name, Code, and Description.');
      return;
    }

    if (editingDept) {
      updateDepartment({
        ...editingDept,
        name: deptName,
        code: deptCode.toUpperCase(),
        description: deptDescription,
        contactEmail: deptEmail,
        nodalOfficer: deptNodalOfficer,
      });
      setEditingDept(null);
    } else {
      addDepartment({
        name: deptName,
        code: deptCode.toUpperCase(),
        iconName: 'Building2',
        description: deptDescription,
        contactEmail: deptEmail || 'helpdesk@kerala.gov.in',
        nodalOfficer: deptNodalOfficer || 'Joint Secretary',
        services: [],
      });
      setIsAddDeptModalOpen(false);
    }
  };

  // Save New Service to Department
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    setServiceFormError(null);

    if (!serviceName.trim() || !serviceCode.trim()) {
      setServiceFormError('Please provide Service Name and Code.');
      return;
    }

    if (addingServiceToDeptId) {
      addServiceToDepartment(addingServiceToDeptId, {
        name: serviceName,
        code: serviceCode.toUpperCase(),
        description: serviceDescription || 'Citizen public service.',
        category: serviceCategory || 'General',
      });
      setAddingServiceToDeptId(null);
      setServiceName('');
      setServiceCode('');
      setServiceDescription('');
      setServiceCategory('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-[#E5E9E6] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#46664F] uppercase tracking-wider block mb-1">
            Department & Hierarchy Configuration
          </span>
          <h2 className="text-xl font-bold text-stone-900">
            Government Services Catalog
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Configure participating departments, citizen services, and official contact channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setDeptName('');
              setDeptCode('');
              setDeptDescription('');
              setDeptEmail('');
              setDeptNodalOfficer('');
              setDeptFormError(null);
              setIsAddDeptModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#46664F] text-white hover:bg-[#38523F] transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Prototype Notice Alert */}
      <div className="p-4 rounded-xl bg-[#FEF8EB] border border-[#FDE68A] text-xs text-[#92400E] flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Demo State Notice</p>
          <p className="leading-relaxed">
            All additions, edits, and deletions are saved to your browser&apos;s local storage for realistic prototype demonstration. Newly added services immediately become available in the citizen feedback submission form.
          </p>
        </div>
      </div>

      {/* Department Cards List */}
      <div className="space-y-4">
        {departments.map((dept) => {
          const isExpanded = expandedDeptId === dept.id;

          return (
            <Card key={dept.id} className="overflow-hidden">
              <div
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-stone-50/60 transition-colors"
                onClick={() => setExpandedDeptId(isExpanded ? null : dept.id)}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF2ED] text-[#46664F] flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-stone-900 truncate">{dept.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-mono font-bold">
                        {dept.code}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{dept.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-stone-400 font-medium hidden sm:inline">
                    {dept.services.length} Services Listed
                  </span>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(dept)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                      title="Edit Department"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete department "${dept.name}" and all its services?`)) {
                          deleteDepartment(dept.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronRight className="w-4 h-4 text-stone-400" />}
                </div>
              </div>

              {/* Expanded Services Drawer */}
              {isExpanded && (
                <div className="bg-[#FAF5F5]/30 border-t border-stone-100 p-5 space-y-4 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-4 text-stone-600">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#46664F]" />
                        <strong>Nodal:</strong> {dept.nodalOfficer}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#46664F]" />
                        {dept.contactEmail}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAddingServiceToDeptId(dept.id);
                        setServiceName('');
                        setServiceCode('');
                        setServiceDescription('');
                        setServiceCategory('');
                        setServiceFormError(null);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#38523F] bg-[#EBF2ED] hover:bg-[#DCE9E0] transition-colors self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Service to {dept.code}</span>
                    </button>
                  </div>

                  {/* Services List Table */}
                  <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-4">Service Name</th>
                          <th className="py-2.5 px-3">Service Code</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-4">Description</th>
                          <th className="py-2.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-stone-700">
                        {dept.services.map((srv) => (
                          <tr key={srv.id} className="hover:bg-stone-50">
                            <td className="py-2.5 px-4 font-semibold text-stone-900">{srv.name}</td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-stone-600">{srv.code}</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[10px]">
                                {srv.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-stone-500 max-w-xs truncate">{srv.description}</td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Remove service "${srv.name}" from ${dept.name}?`)) {
                                    deleteServiceFromDepartment(dept.id, srv.id);
                                  }
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Remove Service"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {dept.services.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-stone-400 text-xs">
                              No services configured under this department yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Department Modal */}
      {(isAddDeptModalOpen || editingDept) && (
        <Modal
          isOpen={isAddDeptModalOpen || Boolean(editingDept)}
          onClose={() => {
            setIsAddDeptModalOpen(false);
            setEditingDept(null);
          }}
          title={editingDept ? `Edit Department: ${editingDept.name}` : 'Add New Government Department'}
          description="Define the department name, tracking acronym, and nodal contact details."
          maxWidth="lg"
        >
          <form onSubmit={handleSaveDepartment} className="space-y-4 text-xs">
            {deptFormError && (
              <p className="text-xs text-red-600 p-2 rounded bg-red-50 border border-red-200">
                {deptFormError}
              </p>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Department Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                placeholder="e.g. Kerala Fire and Rescue Services"
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Code / Acronym <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  placeholder="e.g. KFRS"
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 uppercase bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nodal Officer Title
                </label>
                <input
                  type="text"
                  value={deptNodalOfficer}
                  onChange={(e) => setDeptNodalOfficer(e.target.value)}
                  placeholder="e.g. Additional Director"
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Official Helpdesk Email
              </label>
              <input
                type="email"
                value={deptEmail}
                onChange={(e) => setDeptEmail(e.target.value)}
                placeholder="e.g. fire.helpdesk@kerala.gov.in"
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Department Scope Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={deptDescription}
                onChange={(e) => setDeptDescription(e.target.value)}
                placeholder="Brief summary of public services rendered..."
                className="w-full rounded-xl border border-stone-300 p-2.5 text-stone-900 bg-white leading-relaxed"
              />
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddDeptModalOpen(false);
                  setEditingDept(null);
                }}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#46664F] text-white font-semibold hover:bg-[#38523F]"
              >
                {editingDept ? 'Save Changes' : 'Create Department'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Service Modal */}
      {addingServiceToDeptId && (
        <Modal
          isOpen={Boolean(addingServiceToDeptId)}
          onClose={() => setAddingServiceToDeptId(null)}
          title="Add Specific Public Service"
          description="Register a new citizen service transaction under this department."
          maxWidth="md"
        >
          <form onSubmit={handleSaveService} className="space-y-4 text-xs">
            {serviceFormError && (
              <p className="text-xs text-red-600 p-2 rounded bg-red-50 border border-red-200">
                {serviceFormError}
              </p>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Service Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g. Fire Safety Certificate (NOC)"
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Service Identifier Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={serviceCode}
                  onChange={(e) => setServiceCode(e.target.value)}
                  placeholder="e.g. FRS-01"
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 font-mono bg-white uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Functional Category
                </label>
                <input
                  type="text"
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                  placeholder="e.g. Safety Inspection"
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Service Description
              </label>
              <textarea
                rows={2}
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                placeholder="Citizen workflow details..."
                className="w-full rounded-xl border border-stone-300 p-2.5 text-stone-900 bg-white"
              />
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddingServiceToDeptId(null)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#46664F] text-white font-semibold hover:bg-[#38523F]"
              >
                Add Service
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
