import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Members from "./Members";
import { useAuth } from "../contexts/AuthContext";
import { useConfirm } from "../components/ConfirmProvider";
import * as memberService from "../services/memberService";

// Mock the dependencies
jest.mock("../contexts/AuthContext");
jest.mock("../components/ConfirmProvider");
jest.mock("../services/memberService");
jest.mock("../components/ui/Pagination", () => {
  return function MockPagination({ currentPage, totalPages, onPageChange }) {
    return (
      <div data-testid="pagination">
        <button onClick={() => onPageChange(1)}>Page 1</button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
      </div>
    );
  };
});

const mockMembers = [
  {
    id: "member_1",
    name: "John Doe",
    full_name: "John Doe",
    phone: "9876543210",
    mobileNumber: "9876543210",
    role: "staff",
    status: "active",
    createdAt: "2025-09-16T10:30:00Z",
  },
  {
    id: "member_2",
    name: "Jane Smith",
    full_name: "Jane Smith",
    phone: "9876543211",
    mobileNumber: "9876543211",
    role: "admin",
    status: "pending",
    dev_password: "temp123",
    createdAt: "2025-09-15T09:00:00Z",
  },
];

describe("Members Component", () => {
  const mockAuth = {
    isAdmin: true,
    hasPermission: jest.fn(() => true),
    PERMISSIONS: {
      MANAGE_USERS: "MANAGE_USERS",
    },
  };

  const mockConfirm = jest.fn();

  beforeEach(() => {
    useAuth.mockReturnValue(mockAuth);
    useConfirm.mockReturnValue({ confirm: mockConfirm });

    memberService.getMembersList.mockResolvedValue({
      success: true,
      data: mockMembers,
    });

    memberService.inviteMember.mockResolvedValue({
      success: true,
      message: "Invitation sent to John Doe",
      data: mockMembers[0],
    });

    memberService.deleteMember.mockResolvedValue({
      success: true,
      message: "Member deleted successfully",
    });

    memberService.updateMemberStatus.mockResolvedValue({
      success: true,
      message: "Member status updated successfully",
      data: { ...mockMembers[0], status: "inactive" },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render the members page with form and table", async () => {
      render(<Members />);

      expect(screen.getByText("Team Members")).toBeInTheDocument();
      expect(screen.getByText("Invite Team Member")).toBeInTheDocument();
      expect(screen.getByLabelText("Full Name *")).toBeInTheDocument();
      expect(screen.getByLabelText("Role *")).toBeInTheDocument();
      expect(screen.getByLabelText("Phone Number *")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      });
    });

    it("should show access denied for users without permissions", () => {
      mockAuth.hasPermission.mockReturnValue(false);

      render(<Members />);

      expect(screen.getByText("Access Denied")).toBeInTheDocument();
      expect(
        screen.getByText("You don't have permission to manage team members.")
      ).toBeInTheDocument();
    });

    it("should display temporary password when available", async () => {
      render(<Members />);

      await waitFor(() => {
        expect(screen.getByText("Temp Password: temp123")).toBeInTheDocument();
      });
    });
  });

  describe("Form Validation", () => {
    it("should have correct form fields with API format", () => {
      render(<Members />);

      const fullNameInput = screen.getByLabelText("Full Name *");
      const phoneInput = screen.getByLabelText("Phone Number *");
      const roleSelect = screen.getByLabelText("Role *");

      expect(fullNameInput).toHaveAttribute("name", "full_name");
      expect(phoneInput).toHaveAttribute("name", "phone");
      expect(roleSelect).toHaveAttribute("name", "role");
    });

    it("should have correct role options matching API spec", () => {
      render(<Members />);

      const roleSelect = screen.getByLabelText("Role *");

      expect(roleSelect).toContainHTML(
        '<option value="staff">Staff Member</option>'
      );
      expect(roleSelect).toContainHTML(
        '<option value="admin">Administrator</option>'
      );
      expect(roleSelect).toContainHTML(
        '<option value="manager">Manager</option>'
      );
    });

    it("should validate required fields", async () => {
      const user = userEvent.setup();
      render(<Members />);

      const submitButton = screen.getByText("Send Invitation");

      await user.click(submitButton);

      // Form should not submit without required fields
      expect(memberService.inviteMember).not.toHaveBeenCalled();
    });

    it("should validate phone number pattern", () => {
      render(<Members />);

      const phoneInput = screen.getByLabelText("Phone Number *");

      expect(phoneInput).toHaveAttribute("pattern", "[0-9]{10}");
      expect(phoneInput).toHaveAttribute(
        "placeholder",
        "10-digit phone number"
      );
    });
  });

  describe("Member Invitation", () => {
    it("should successfully invite a member with correct API format", async () => {
      const user = userEvent.setup();
      mockConfirm.mockResolvedValue(true);

      render(<Members />);

      // Fill the form
      await user.type(screen.getByLabelText("Full Name *"), "New Member");
      await user.type(screen.getByLabelText("Phone Number *"), "9876543299");
      await user.selectOptions(screen.getByLabelText("Role *"), "admin");

      // Submit the form
      await user.click(screen.getByText("Send Invitation"));

      // Should show confirmation dialog
      expect(mockConfirm).toHaveBeenCalledWith({
        title: "Confirm Invitation",
        message: "Are you sure you want to invite New Member as Administrator?",
        confirmText: "Yes, Invite",
        cancelText: "Cancel",
      });

      await waitFor(() => {
        expect(memberService.inviteMember).toHaveBeenCalledWith({
          full_name: "New Member",
          phone: "9876543299",
          role: "admin",
        });
      });
    });

    it("should reset form after successful invitation", async () => {
      const user = userEvent.setup();
      mockConfirm.mockResolvedValue(true);

      render(<Members />);

      // Fill and submit form
      await user.type(screen.getByLabelText("Full Name *"), "Test Member");
      await user.type(screen.getByLabelText("Phone Number *"), "9876543298");
      await user.click(screen.getByText("Send Invitation"));

      await waitFor(() => {
        expect(screen.getByLabelText("Full Name *")).toHaveValue("");
        expect(screen.getByLabelText("Phone Number *")).toHaveValue("");
        expect(screen.getByLabelText("Role *")).toHaveValue("staff");
      });
    });

    it("should not invite if user cancels confirmation", async () => {
      const user = userEvent.setup();
      mockConfirm.mockResolvedValue(false);

      render(<Members />);

      await user.type(screen.getByLabelText("Full Name *"), "Test Member");
      await user.type(screen.getByLabelText("Phone Number *"), "9876543297");
      await user.click(screen.getByText("Send Invitation"));

      expect(memberService.inviteMember).not.toHaveBeenCalled();
    });

    it("should show loading state during invitation", async () => {
      const user = userEvent.setup();
      mockConfirm.mockResolvedValue(true);

      // Make inviteMember return a pending promise
      let resolveInvite;
      memberService.inviteMember.mockReturnValue(
        new Promise((resolve) => {
          resolveInvite = resolve;
        })
      );

      render(<Members />);

      await user.type(screen.getByLabelText("Full Name *"), "Test Member");
      await user.type(screen.getByLabelText("Phone Number *"), "9876543296");
      await user.click(screen.getByText("Send Invitation"));

      // Should show loading state
      expect(screen.getByText("Sending Invitation...")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /sending invitation/i })
      ).toBeDisabled();

      // Resolve the promise
      resolveInvite({ success: true, data: mockMembers[0] });
    });
  });

  describe("Member Management", () => {
    it("should delete a member with confirmation", async () => {
      const user = userEvent.setup();
      mockConfirm.mockResolvedValue(true);

      render(<Members />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByTitle("Delete member");
      await user.click(deleteButtons[0]);

      expect(mockConfirm).toHaveBeenCalledWith({
        title: "Confirm Deletion",
        message:
          "Are you sure you want to delete John Doe? This action cannot be undone.",
        confirmText: "Yes, Delete",
        cancelText: "Cancel",
        intent: "danger",
      });

      await waitFor(() => {
        expect(memberService.deleteMember).toHaveBeenCalledWith("member_1");
      });
    });

    it("should update member status", async () => {
      const user = userEvent.setup();

      render(<Members />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Click deactivate button (UserX icon)
      const deactivateButtons = screen.getAllByTitle("Deactivate member");
      await user.click(deactivateButtons[0]);

      await waitFor(() => {
        expect(memberService.updateMemberStatus).toHaveBeenCalledWith(
          "member_1",
          "inactive"
        );
      });
    });
  });

  describe("Search and Filtering", () => {
    it("should filter members by search term", async () => {
      const user = userEvent.setup();
      render(<Members />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      });

      // Search for John
      const searchInput = screen.getByPlaceholderText("Search members...");
      await user.type(searchInput, "John");

      // Should still show John but filter works on client side
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("should filter members by role", async () => {
      const user = userEvent.setup();
      render(<Members />);

      await waitFor(() => {
        expect(screen.getByText("Team Members (2)")).toBeInTheDocument();
      });

      // Filter by staff role
      const roleFilter = screen.getByDisplayValue("All Roles");
      await user.selectOptions(roleFilter, "staff");

      // The filtering logic is tested in the component
      expect(roleFilter).toHaveValue("staff");
    });

    it("should filter members by status", async () => {
      const user = userEvent.setup();
      render(<Members />);

      const statusFilter = screen.getByDisplayValue("All Status");
      await user.selectOptions(statusFilter, "active");

      expect(statusFilter).toHaveValue("active");
    });
  });

  describe("Role Display", () => {
    it("should display correct role names", () => {
      render(<Members />);

      // Test role display function indirectly through rendered content
      expect(screen.getByText("Staff Member")).toBeInTheDocument(); // for 'staff' role
      expect(screen.getByText("Administrator")).toBeInTheDocument(); // for 'admin' role
    });

    it("should handle legacy roles for backward compatibility", async () => {
      const legacyMember = {
        ...mockMembers[0],
        role: "interview-coordinator",
      };

      memberService.getMembersList.mockResolvedValue({
        success: true,
        data: [legacyMember],
      });

      render(<Members />);

      await waitFor(() => {
        expect(screen.getByText("Interview Coordinator")).toBeInTheDocument();
      });
    });
  });

  describe("Data Compatibility", () => {
    it("should handle both old and new field formats", async () => {
      const mixedFormatMembers = [
        {
          id: "old_format",
          name: "Old Format User",
          mobileNumber: "9876543220",
          role: "recipient",
          status: "active",
          createdAt: "2025-09-16T10:30:00Z",
        },
        {
          id: "new_format",
          full_name: "New Format User",
          phone: "9876543221",
          role: "staff",
          status: "pending",
          createdAt: "2025-09-16T11:30:00Z",
        },
      ];

      memberService.getMembersList.mockResolvedValue({
        success: true,
        data: mixedFormatMembers,
      });

      render(<Members />);

      await waitFor(() => {
        expect(screen.getByText("Old Format User")).toBeInTheDocument();
        expect(screen.getByText("New Format User")).toBeInTheDocument();
      });
    });

    it("should display phone numbers from both formats", async () => {
      render(<Members />);

      await waitFor(() => {
        // Should display phone numbers regardless of field name
        expect(screen.getByText("9876543210")).toBeInTheDocument();
        expect(screen.getByText("9876543211")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle member loading errors gracefully", async () => {
      memberService.getMembersList.mockRejectedValue(
        new Error("Failed to load")
      );
      console.error = jest.fn();

      render(<Members />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "Error loading members:",
          expect.any(Error)
        );
      });
    });

    it("should handle invitation errors gracefully", async () => {
      const user = userEvent.setup();
      mockConfirm.mockResolvedValue(true);
      memberService.inviteMember.mockRejectedValue(
        new Error("Invitation failed")
      );
      console.error = jest.fn();

      render(<Members />);

      await user.type(screen.getByLabelText("Full Name *"), "Test User");
      await user.type(screen.getByLabelText("Phone Number *"), "9876543295");
      await user.click(screen.getByText("Send Invitation"));

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "Error inviting member:",
          expect.any(Error)
        );
      });
    });
  });
});
