import React, { useState, useEffect } from 'react';
import { authFetch } from '../../utils/auth';
import useUser from '../../hooks/useUser';

const ShareModal = ({ 
  showModal, 
  onClose, 
  wallRef,
  draftId,
  registeredUser,
  wallData,
  onDraftCreated,
  previewImage // New prop for preview image
}) => {
  const { fetchSensitiveData } = useUser();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [shareUrl, setShareUrl] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [shareMode, setShareMode] = useState('link'); // 'link' or 'users'
  const [linkPermission, setLinkPermission] = useState('edit'); // 'edit' or 'view'

  // Fetch current user ID when modal opens
  useEffect(() => {
    if (showModal && !currentUserId) {
      fetchSensitiveData().then(userData => {
        if (userData) {
          setCurrentUserId(userData.id);
        }
      });
    }
  }, [showModal, currentUserId, fetchSensitiveData]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchUsers = async (query) => {
    try {
      setIsSearching(true);
      const apiBase = import.meta.env.VITE_API_BASE_URL;
      const response = await authFetch(`${apiBase}/users/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search users');
      const users = await response.json();
      // Filter out the current user and already selected users
      setSearchResults(users.filter(user => 
        user._id !== currentUserId && 
        !selectedUsers.some(selected => selected._id === user._id)
      ));
    } catch (error) {
      console.error('Search users error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchResults(searchResults.filter(u => u._id !== user._id));
    setSearchQuery('');
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(user => user._id !== userId));
  };

  const handleShareWithUsers = async () => {
    try {
      setIsLoading(true);
      setError('');

      let finalDraftId = draftId;

      const apiBase = import.meta.env.VITE_API_BASE_URL;
      // Require previewImage for new draft
      if (!draftId) {
        if (!previewImage) {
          setIsLoading(false);
          setError('A preview image is required to share this wall.');
          return;
        }
        // Create a new draft for sharing
        const response = await authFetch(`${apiBase}/drafts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Shared Wall ${new Date().toLocaleDateString()}`,
            wallData: wallData,
            previewImage: previewImage
          }),
        });

        if (!response.ok) throw new Error('Failed to create new draft');
        const result = await response.json();
        finalDraftId = result.draft._id;
        
        if (onDraftCreated) {
          onDraftCreated(finalDraftId);
        }
      }

      // Share with selected users
      const shareResponse = await authFetch(`${apiBase}/drafts/${finalDraftId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers.map(user => user._id)
        }),
      });

      if (!shareResponse.ok) throw new Error('Failed to share with selected users');

      setShareSuccess(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error sharing wall:', error);
      setError(error.message || 'Failed to share with selected users. Please try again.');
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      setIsLoading(true);
      setShareSuccess(false);
      setError('');

      let finalDraftId = draftId;
      let shareToken = null;

      const apiBase = import.meta.env.VITE_API_BASE_URL;
      // Require previewImage for new draft
      if (!draftId) {
        if (!previewImage) {
          setIsLoading(false);
          setError('A preview image is required to share this wall.');
          return;
        }
        // Create a new draft for sharing
        const response = await authFetch(`${apiBase}/drafts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Shared Wall ${new Date().toLocaleDateString()}`,
            wallData: wallData,
            isPublic: true,
            linkPermission: linkPermission, // Add permission to draft
            previewImage: previewImage
          }),
        });

        if (!response.ok) throw new Error('Failed to create new draft');
        const result = await response.json();
        finalDraftId = result.draft._id;
        
        if (onDraftCreated) {
          onDraftCreated(finalDraftId);
        }
      }

      // Request backend to set public and get share token
      const updateResponse = await authFetch(`${apiBase}/drafts/${finalDraftId}/public`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isPublic: true,
            linkPermission: linkPermission // Update permission
          }),
        });

        if (!updateResponse.ok) {
        throw new Error('Failed to update draft as public');
      }
      const updateData = await updateResponse.json();
      shareToken = updateData.shareToken;

      // Generate shareable URL with token and permission parameter
      const shareableUrl = `${window.location.origin}/wall?draftId=${finalDraftId}&shared=true&token=${shareToken}&permission=${linkPermission}`;
      setShareUrl(shareableUrl);
      setIsLoading(false);
    } catch (error) {
      console.error('Error sharing wall:', error);
      setError(error.message || 'Failed to create shareable link. Please try again.');
      setIsLoading(false);
    }
  };

  // Start sharing process when modal opens or permission changes
  useEffect(() => {
    if (showModal && shareMode === 'link' && !shareUrl && !error) {
      handleShare();
    }
  }, [showModal, shareMode, linkPermission]);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" style={{ zIndex: 9999 }} onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4" style={{ zIndex: 10000 }}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Share Your Wall Design</h2>

        {/* Share Mode Toggle */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setShareMode('link')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              shareMode === 'link'
                ? 'bg-primary text-secondary'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Share Link
          </button>
          <button
            onClick={() => setShareMode('users')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              shareMode === 'users'
                ? 'bg-primary text-secondary'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Share with Users
          </button>
        </div>

        {/* Link Permission Selector - Only show in link mode */}
        {shareMode === 'link' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Link Permissions:</h3>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="edit"
                  checked={linkPermission === 'edit'}
                  onChange={(e) => {
                    setLinkPermission(e.target.value);
                    setShareUrl(''); // Reset URL to regenerate with new permission
                    setShareSuccess(false);
                  }}
                  className="mr-3 text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-medium text-gray-800">Can Edit</span>
                  <p className="text-xs text-gray-600">Anyone with this link can view and modify the wall design</p>
                </div>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="view"
                  checked={linkPermission === 'view'}
                  onChange={(e) => {
                    setLinkPermission(e.target.value);
                    setShareUrl(''); // Reset URL to regenerate with new permission
                    setShareSuccess(false);
                  }}
                  className="mr-3 text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-medium text-gray-800">View Only</span>
                  <p className="text-xs text-gray-600">Anyone with this link can only view the wall design</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {error ? (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
            <button
              onClick={shareMode === 'link' ? handleShare : handleShareWithUsers}
              className="mt-4 w-full bg-primary text-secondary px-4 py-2 rounded-lg hover:bg-primary-dark transition"
            >
              Try Again
            </button>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-dark mx-auto mb-4"></div>
            <p className="text-gray-600">
              {shareMode === 'link' ? 'Generating shareable link...' : 'Sharing with selected users...'}
            </p>
          </div>
        ) : shareMode === 'users' ? (
          <div className="py-4">
            {/* User Search */}
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name or email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Users:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(user => (
                    <div
                      key={user._id}
                      className="flex items-center bg-gray-100 rounded-full px-3 py-1"
                    >
                      <span className="text-sm text-gray-800">{user.name}</span>
                      <button
                        onClick={() => handleRemoveUser(user._id)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchQuery && (
              <div className="mb-4 max-h-48 overflow-y-auto">
                {isSearching ? (
                  <div className="text-center py-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-dark mx-auto"></div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map(user => (
                      <button
                        key={user._id}
                        onClick={() => handleSelectUser(user)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <div className="font-medium text-gray-800">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-600 py-2">No users found</p>
                )}
              </div>
            )}

            {/* Share Button */}
            {selectedUsers.length > 0 && !shareSuccess && (
              <button
                onClick={handleShareWithUsers}
                className="w-full bg-primary text-secondary px-4 py-2 rounded-lg hover:bg-primary-dark transition"
              >
                Share with Selected Users
              </button>
            )}

            {/* Success Message */}
            {shareSuccess && (
              <div className="text-center py-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-gray-600">Successfully shared with selected users!</p>
              </div>
            )}
          </div>
        ) : shareSuccess ? (
          <div className="text-center py-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-gray-600 mb-4">
              {linkPermission === 'edit' ? 'Editable link' : 'View-only link'} copied to clipboard!
            </p>
            <div className="flex items-center p-2 bg-gray-100 rounded-lg mb-4">
              <input 
                type="text" 
                readOnly 
                value={shareUrl} 
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 overflow-hidden text-ellipsis"
              />
            </div>
          </div>
        ) : shareUrl ? (
          <div className="py-4">
            <p className="text-gray-600 mb-4">
              Share this link to let anyone {linkPermission === 'edit' ? 'view and edit' : 'view'} your wall design:
            </p>
            <div className="flex items-center p-2 bg-gray-100 rounded-lg mb-4">
              <input 
                type="text" 
                readOnly 
                value={shareUrl} 
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 overflow-hidden text-ellipsis"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  setShareSuccess(true);
                }}
                className="ml-2 text-primary hover:text-primary-dark"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              </button>
            </div>
            {/* Permission indicator */}
            <div className="flex items-center justify-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                linkPermission === 'edit' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {linkPermission === 'edit' ? (
                  <>
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Can Edit
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Only
                  </>
                )}
              </span>
            </div>
          </div>
        ) : null}

        <div className="flex justify-between mt-6">
          <button
            onClick={() => {
              onClose();
              setShareUrl('');
              setShareSuccess(false);
              setError('');
              setSelectedUsers([]);
              setSearchQuery('');
              setSearchResults([]);
              setLinkPermission('edit'); // Reset permission to default
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
          >
            Close
          </button>

          {shareMode === 'link' && shareUrl && !shareSuccess && !error && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                setShareSuccess(true);
              }}
              className="px-4 py-2 bg-primary text-secondary rounded-lg hover:bg-primary-dark transition"
            >
              Copy Link
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;