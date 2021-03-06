=head1 LICENSE

Copyright [1999-2014] Wellcome Trust Sanger Institute and the EMBL-European Bioinformatics Institute

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

=cut

package EnsEMBL::Admin::Command::HelpRecord::Image;

use strict;
use warnings;

use EnsEMBL::Web::Exceptions;

use parent qw(EnsEMBL::Web::Command);

sub process {
  my $self      = shift;
  my $hub       = $self->hub;
  my $object    = $self->object;
  my $function  = $hub->function;
  my $redirect  = {'action' => 'Images', 'function' => 'List'};
  my ($list, $error);

  try {
    $list = $object->get_help_images_list;
  } catch {
    $error = 1;
  };

  unless ($error) {
  
    my $file  = $hub->param('file');
    ($file)   = grep {$_->{'name'} eq $file} @$list if $file;

    # validation
    if (!$file && $function eq 'Upload' || $file && grep {$_ eq $function} @{$file->{'action'}}) {

      my $root = `pwd`;
      chdir $object->get_help_images_dir;

      # Update from head
      if ($function eq 'Update') {
        system('cvs', '-Q', 'update', '-A', $file->{'name'});

      # Upload new image or replace an existing image
      } elsif ($function eq 'Upload') {
        $redirect->{'function'} = 'View';
        $redirect->{'file'}     = $self->upload_file({'param' => 'upload', 'name' => $file->{'name'} || ''});

      # Delete new image or reset a locally modified image
      } elsif ($function eq 'Delete') {
        if (unlink($file->{'name'})) {
          unless ($file->{'cvs'} eq 'New') {
            system('cvs', '-Q', 'update', '-A', $file->{'name'});
            $redirect->{'function'} = 'View';
            $redirect->{'file'}     = $file->{'name'};
          }
        }

      # Commit local modifications to cvs
      } elsif ($function eq 'Commit') {
        my $message = $hub->param('message');
        system('cvs', 'add', $file->{'name'}) if $file->{'cvs'} eq 'New';
        system('cvs', 'commit', '-m', sprintf('%sCommitted by %s via Admin site', $message ? "$message - " : '', split('@', $hub->user->email)), $file->{'name'});
      }

      # reset folder location
      chop  $root;
      chdir $root;
    }
  }

  return $self->ajax_redirect($hub->url($redirect));
}

sub upload_file {
  ## Uploads a file with given parameter from CGI and saves it with given name
  ## @param Hashref with following keys:
  ##  - param:    CGI param name that contains the uploaded file
  ##  - folder:   Folder to which the file has to be uploaded, defaults to current directory
  ##  - name:     Final name of the file (defaults to the name of the file uploaded)
  ## @return Name of the saved file
  my ($self, $params) = @_;
  my $hub   = $self->hub;
  my $fh    = $hub->param($params->{'param'});
  my $name  = $params->{'name'} || "$fh";
     $name  =~ s/\s+/_/;
     $name  =~ s/[^a-zA-Z0-9_.-]+//;

  throw exception('FileException', 'File could not be uploaded successfully') unless fileno $fh;

  open    (UPLOADFILE, '>', sprintf('%s/%s', $params->{'folder'} || '.', $name)) or throw exception('FileException', $!);
  binmode UPLOADFILE;
  print   UPLOADFILE while <$fh>;
  close   UPLOADFILE;

  return $name;
}

1;
